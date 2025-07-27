/**
 * Testes para o serviço de mensagens do Supabase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Message } from '~/core/messages';

import { messagesService } from '../messages';

// Mock do cliente Supabase
vi.mock('~/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              gt: vi.fn(() => Promise.resolve({
                data: [],
                error: null,
                count: 0
              })),
              range: vi.fn(() => Promise.resolve({
                data: [],
                error: null,
                count: 0
              }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'test-id' },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}));

// Mock do módulo retry
vi.mock('~/lib/supabase/retry', () => ({
  withRetry: vi.fn((fn) => fn())
}));

describe('messagesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversationMessages', () => {
    it('deve buscar mensagens com paginação padrão', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          content: 'Test message 1',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          content: 'Test message 2',
          role: 'assistant',
          created_at: '2024-01-01T00:01:00Z'
        }
      ];

      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      // Configurar mock para retornar mensagens
      vi.mocked(mockClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockMessages,
                error: null,
                count: 2
              })
            })
          })
        })
      } as any);

      const result = await messagesService.getConversationMessages('conv1');

      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.messages[0].id).toBe('msg1');
    });

    it('deve detectar quando há mais mensagens', async () => {
      const mockMessages = Array(51).fill(null).map((_, i) => ({
        id: `msg${i}`,
        conversation_id: 'conv1',
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        created_at: new Date(2024, 0, 1, 0, i).toISOString()
      }));

      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      vi.mocked(mockClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockMessages,
                error: null,
                count: 100
              })
            })
          })
        })
      } as any);

      const result = await messagesService.getConversationMessages('conv1', { limit: 50 });

      expect(result.messages).toHaveLength(50);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it('deve usar cursor para paginação', async () => {
      const cursor = '2024-01-01T00:50:00Z';
      
      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      const mockGt = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      vi.mocked(mockClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                gt: mockGt
              })
            })
          })
        })
      } as any);

      await messagesService.getConversationMessages('conv1', { cursor });

      expect(mockGt).toHaveBeenCalledWith('created_at', cursor);
    });
  });

  describe('createMessage', () => {
    it('deve criar mensagem com retry', async () => {
      const message: Message = {
        id: 'msg123',
        threadId: 'conv123',
        role: 'user',
        content: 'Test message',
        contentChunks: ['Test message']
      };

      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'msg123',
              conversation_id: 'conv123',
              content: 'Test message',
              role: 'user'
            },
            error: null
          })
        })
      });

      vi.mocked(mockClient.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const result = await messagesService.createMessage(message);

      expect(result.id).toBe('msg123');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'msg123',
        conversation_id: 'conv123',
        content: 'Test message',
        role: 'user',
        agent: undefined,
        finish_reason: undefined,
        reasoning_content: null,
        tool_calls: null,
        resources: null,
        metadata: null
      });
    });

    it('deve serializar tool_calls e resources', async () => {
      const message: Message = {
        id: 'msg123',
        threadId: 'conv123',
        role: 'assistant',
        content: 'Using tool',
        contentChunks: ['Using tool'],
        toolCalls: [{ id: 'tool1', name: 'search', arguments: { query: 'test' } }],
        resources: [{ type: 'url', url: 'https://example.com' }]
      };

      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'msg123' },
            error: null
          })
        })
      });

      vi.mocked(mockClient.from).mockReturnValue({
        insert: mockInsert
      } as any);

      await messagesService.createMessage(message);

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData.tool_calls).toBe(JSON.stringify(message.toolCalls));
      expect(insertedData.resources).toBe(JSON.stringify(message.resources));
    });
  });

  describe('updateMessage', () => {
    it('deve atualizar mensagem com campos modificados', async () => {
      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'msg123',
                content: 'Updated content',
                finish_reason: 'stop'
              },
              error: null
            })
          })
        })
      });

      vi.mocked(mockClient.from).mockReturnValue({
        update: mockUpdate
      } as any);

      const result = await messagesService.updateMessage('msg123', {
        content: 'Updated content',
        finishReason: 'stop'
      });

      expect(result.content).toBe('Updated content');
      expect(mockUpdate).toHaveBeenCalledWith({
        content: 'Updated content',
        finish_reason: 'stop'
      });
    });
  });

  describe('getAllConversationMessages', () => {
    it('deve buscar todas as mensagens usando paginação', async () => {
      const { getSupabaseClient } = await import('~/lib/supabase/client');
      const mockClient = getSupabaseClient();
      
      let callCount = 0;
      const mockPages = [
        // Primeira página
        Array(100).fill(null).map((_, i) => ({
          id: `msg${i}`,
          conversation_id: 'conv1',
          content: `Message ${i}`,
          role: 'user',
          created_at: new Date(2024, 0, 1, 0, i).toISOString()
        })),
        // Segunda página
        Array(50).fill(null).map((_, i) => ({
          id: `msg${i + 100}`,
          conversation_id: 'conv1',
          content: `Message ${i + 100}`,
          role: 'user',
          created_at: new Date(2024, 0, 1, 1, i).toISOString()
        }))
      ];

      vi.mocked(mockClient.from).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                const data = callCount < mockPages.length ? 
                  [...mockPages[callCount], {}] : // Adiciona um extra para simular hasMore
                  mockPages[mockPages.length - 1].slice(0, 50);
                callCount++;
                
                return Promise.resolve({
                  data,
                  error: null,
                  count: 150
                });
              }),
              gt: vi.fn().mockImplementation(() => {
                const data = callCount < mockPages.length ? 
                  [...mockPages[callCount], {}] :
                  [];
                callCount++;
                
                return Promise.resolve({
                  data,
                  error: null,
                  count: 150
                });
              })
            })
          })
        })
      } as any));

      const result = await messagesService.getAllConversationMessages('conv1');

      expect(result).toHaveLength(150);
      expect(result[0].id).toBe('msg0');
      expect(result[149].id).toBe('msg149');
    });
  });
});