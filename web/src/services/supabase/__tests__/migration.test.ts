/**
 * Testes para o serviço de migração localStorage -> Supabase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getSupabaseClient } from '~/lib/supabase/client';

import { conversationsService } from '../conversations';
import { messagesService } from '../messages';
import { migrateLocalStorageToSupabase } from '../migration';

// Mock dos módulos
vi.mock('~/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn()
}));

vi.mock('../conversations', () => ({
  conversationsService: {
    createConversation: vi.fn()
  }
}));

vi.mock('../messages', () => ({
  messagesService: {
    createMessage: vi.fn()
  }
}));

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  removeItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('migrateLocalStorageToSupabase', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock do cliente Supabase
    mockSupabase = {
      auth: {
        getUser: vi.fn()
      }
    };
    
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it('deve retornar erro se usuário não está autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: false,
      error: 'Usuário não autenticado'
    });
  });

  it('deve migrar threads e mensagens com sucesso', async () => {
    // Mock do usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    // Mock dos dados no localStorage
    const mockThreads = [
      {
        id: 'thread-1',
        createdAt: '2024-01-01T00:00:00Z',
        title: 'Thread 1',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            contentChunks: ['Hello']
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there',
            contentChunks: ['Hi there']
          }
        ]
      },
      {
        id: 'thread-2',
        createdAt: '2024-01-02T00:00:00Z',
        title: 'Thread 2',
        messages: [
          {
            id: 'msg-3',
            role: 'user',
            content: 'Test',
            contentChunks: ['Test']
          }
        ]
      }
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockThreads));

    // Mock dos serviços
    vi.mocked(conversationsService.createConversation).mockResolvedValue({
      id: 'thread-1',
      title: 'Thread 1',
      user_id: 'user-123'
    } as any);

    vi.mocked(messagesService.createMessage).mockResolvedValue({} as any);

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: true,
      migratedThreads: 2,
      migratedMessages: 3
    });

    // Verificar que as conversas foram criadas
    expect(conversationsService.createConversation).toHaveBeenCalledTimes(2);
    expect(conversationsService.createConversation).toHaveBeenCalledWith({
      id: 'thread-1',
      title: 'Thread 1',
      created_at: '2024-01-01T00:00:00Z'
    });

    // Verificar que as mensagens foram criadas
    expect(messagesService.createMessage).toHaveBeenCalledTimes(3);
    expect(messagesService.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1',
        threadId: 'thread-1',
        role: 'user',
        content: 'Hello'
      })
    );

    // Verificar que o localStorage foi limpo
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('deer-flow-threads');
  });

  it('deve lidar com erro na criação de conversa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'thread-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Test' }]
      }
    ]));

    vi.mocked(conversationsService.createConversation).mockRejectedValue(
      new Error('Database error')
    );

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: false,
      error: 'Database error'
    });
  });

  it('deve continuar migrando mesmo com falha em uma mensagem', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'thread-1',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Test 1' },
          { id: 'msg-2', role: 'assistant', content: 'Test 2' }
        ]
      }
    ]));

    vi.mocked(conversationsService.createConversation).mockResolvedValue({} as any);
    
    // Primeira mensagem falha, segunda sucede
    vi.mocked(messagesService.createMessage)
      .mockRejectedValueOnce(new Error('Message error'))
      .mockResolvedValueOnce({} as any);

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: true,
      migratedThreads: 1,
      migratedMessages: 1 // Apenas 1 das 2 mensagens foi migrada
    });
  });

  it('deve retornar sucesso se não há dados para migrar', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue(null);

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: true,
      migratedThreads: 0,
      migratedMessages: 0
    });
  });

  it('deve lidar com dados corrompidos no localStorage', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue('invalid json');

    const result = await migrateLocalStorageToSupabase();

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining('Unexpected token')
    });
  });

  it('deve usar título padrão quando thread não tem título', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'thread-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Test' }]
      }
    ]));

    vi.mocked(conversationsService.createConversation).mockResolvedValue({} as any);
    vi.mocked(messagesService.createMessage).mockResolvedValue({} as any);

    await migrateLocalStorageToSupabase();

    expect(conversationsService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Conversa sem título'
      })
    );
  });

  it('deve mapear corretamente contentChunks antigas', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'thread-1',
        messages: [{
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          // Sem contentChunks definido
        }]
      }
    ]));

    vi.mocked(conversationsService.createConversation).mockResolvedValue({} as any);
    vi.mocked(messagesService.createMessage).mockResolvedValue({} as any);

    await migrateLocalStorageToSupabase();

    expect(messagesService.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        contentChunks: ['Test'] // Deve criar array a partir do content
      })
    );
  });
});