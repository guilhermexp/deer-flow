/**
 * Testes para o hook de real-time messages
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { storeEvents } from '~/core/store/events';
import { getSupabaseClient } from '~/lib/supabase/client';

import { useRealtimeMessages } from '../use-realtime-messages';

// Mock do cliente Supabase
vi.mock('~/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn()
}));

// Mock do storeEvents
vi.mock('~/core/store/events', () => ({
  storeEvents: {
    emit: vi.fn()
  }
}));

describe('useRealtimeMessages', () => {
  let mockChannel: Partial<RealtimeChannel>;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock do canal real-time
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    // Mock do cliente Supabase
    mockSupabase = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn()
    };

    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it('deve inscrever no canal quando conversationId é fornecido', () => {
    const { unmount } = renderHook(() => 
      useRealtimeMessages('conv-123')
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith('messages:conv-123');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.conv-123'
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();

    unmount();
  });

  it('não deve inscrever quando conversationId é null', () => {
    renderHook(() => useRealtimeMessages(null));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('deve emitir evento quando mensagem é inserida', async () => {
    const mockMessage = {
      id: 'msg-123',
      conversation_id: 'conv-123',
      content: 'New message',
      role: 'user',
      created_at: new Date().toISOString()
    };

    renderHook(() => useRealtimeMessages('conv-123'));

    // Simular evento de INSERT
    const insertHandler = vi.mocked(mockChannel.on).mock.calls.find(
      call => call[1].event === 'INSERT'
    )?.[2];

    insertHandler?.({
      eventType: 'INSERT',
      new: mockMessage
    });

    await waitFor(() => {
      expect(storeEvents.emit).toHaveBeenCalledWith({
        type: 'MESSAGE_APPENDED',
        message: expect.objectContaining({
          id: 'msg-123',
          content: 'New message',
          role: 'user'
        })
      });
    });
  });

  it('deve emitir evento quando mensagem é atualizada', async () => {
    const mockMessage = {
      id: 'msg-123',
      conversation_id: 'conv-123',
      content: 'Updated message',
      role: 'assistant',
      finish_reason: 'stop'
    };

    renderHook(() => useRealtimeMessages('conv-123'));

    // Simular evento de UPDATE
    const updateHandler = vi.mocked(mockChannel.on).mock.calls.find(
      call => call[1].event === 'UPDATE'
    )?.[2];

    updateHandler?.({
      eventType: 'UPDATE',
      new: mockMessage
    });

    await waitFor(() => {
      expect(storeEvents.emit).toHaveBeenCalledWith({
        type: 'MESSAGE_UPDATED',
        message: expect.objectContaining({
          id: 'msg-123',
          content: 'Updated message',
          finishReason: 'stop'
        })
      });
    });
  });

  it('deve desinscrever e remover canal ao desmontar', () => {
    const { unmount } = renderHook(() => 
      useRealtimeMessages('conv-123')
    );

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('deve re-inscrever quando conversationId muda', () => {
    const { rerender } = renderHook(
      ({ id }) => useRealtimeMessages(id),
      { initialProps: { id: 'conv-123' } }
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith('messages:conv-123');
    
    // Mudar para nova conversa
    rerender({ id: 'conv-456' });

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
    expect(mockSupabase.channel).toHaveBeenCalledWith('messages:conv-456');
  });

  it('deve tratar erros no payload', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderHook(() => useRealtimeMessages('conv-123'));

    const insertHandler = vi.mocked(mockChannel.on).mock.calls.find(
      call => call[1].event === 'INSERT'
    )?.[2];

    // Payload inválido
    insertHandler?.({
      eventType: 'INSERT',
      new: null
    });

    // Não deve emitir evento
    expect(storeEvents.emit).not.toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('deve lidar com tool_calls e resources serializados', async () => {
    const mockMessage = {
      id: 'msg-123',
      conversation_id: 'conv-123',
      content: 'Using tools',
      role: 'assistant',
      tool_calls: JSON.stringify([{ name: 'search', args: {} }]),
      resources: JSON.stringify([{ type: 'url', url: 'https://example.com' }])
    };

    renderHook(() => useRealtimeMessages('conv-123'));

    const insertHandler = vi.mocked(mockChannel.on).mock.calls.find(
      call => call[1].event === 'INSERT'
    )?.[2];

    insertHandler?.({
      eventType: 'INSERT',
      new: mockMessage
    });

    await waitFor(() => {
      expect(storeEvents.emit).toHaveBeenCalledWith({
        type: 'MESSAGE_APPENDED',
        message: expect.objectContaining({
          toolCalls: [{ name: 'search', args: {} }],
          resources: [{ type: 'url', url: 'https://example.com' }]
        })
      });
    });
  });
});