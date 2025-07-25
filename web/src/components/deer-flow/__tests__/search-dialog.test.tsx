/**
 * Testes para o componente SearchDialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDialog } from '../search-dialog';
import { conversationsService } from '~/services/supabase/conversations';
import { messagesService } from '~/services/supabase/messages';

// Mock dos serviços
vi.mock('~/services/supabase/conversations', () => ({
  conversationsService: {
    search: vi.fn()
  }
}));

vi.mock('~/services/supabase/messages', () => ({
  messagesService: {
    search: vi.fn()
  }
}));

// Mock do router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('SearchDialog', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar botão de busca', () => {
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    const searchButton = screen.getByRole('button', { name: /buscar/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('deve abrir diálogo ao clicar no botão', async () => {
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    const searchButton = screen.getByRole('button', { name: /buscar/i });
    await user.click(searchButton);
    
    expect(screen.getByPlaceholderText(/buscar conversas/i)).toBeInTheDocument();
  });

  it('deve buscar com debounce ao digitar', async () => {
    vi.useFakeTimers();
    
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Test conversation',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    const searchButton = screen.getByRole('button', { name: /buscar/i });
    await user.click(searchButton);
    
    const searchInput = screen.getByPlaceholderText(/buscar conversas/i);
    await user.type(searchInput, 'test');
    
    // Não deve buscar imediatamente
    expect(conversationsService.search).not.toHaveBeenCalled();
    
    // Avançar 500ms (debounce)
    vi.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(conversationsService.search).toHaveBeenCalledWith('test');
      expect(messagesService.search).toHaveBeenCalledWith('test');
    });
    
    vi.useRealTimers();
  });

  it('deve exibir resultados de conversas', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Machine Learning Discussion',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1'
      },
      {
        id: 'conv-2',
        title: 'API Design',
        created_at: '2024-01-02T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Discussion')).toBeInTheDocument();
      expect(screen.getByText('API Design')).toBeInTheDocument();
    });
  });

  it('deve exibir resultados de mensagens', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([]);
    
    vi.mocked(messagesService.search).mockResolvedValue([
      {
        id: 'msg-1',
        content: 'This is a test message about React hooks',
        conversation_id: 'conv-1',
        created_at: '2024-01-01T00:00:00Z',
        role: 'user',
        conversation: {
          title: 'React Discussion'
        }
      }
    ]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    await waitFor(() => {
      expect(screen.getByText(/test message about React hooks/i)).toBeInTheDocument();
      expect(screen.getByText('React Discussion')).toBeInTheDocument();
    });
  });

  it('deve destacar termo de busca nos resultados', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Testing React Components',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'React');
    
    await waitFor(() => {
      const highlightedText = screen.getByText('React', { selector: 'mark' });
      expect(highlightedText).toBeInTheDocument();
      expect(highlightedText.tagName).toBe('MARK');
    });
  });

  it('deve navegar para conversa ao clicar no resultado', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Test Conversation',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Test Conversation'));
    
    expect(mockPush).toHaveBeenCalledWith('/chat/conv-1');
  });

  it('deve exibir mensagem quando não há resultados', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([]);
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'xyz123');
    
    await waitFor(() => {
      expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    });
  });

  it('deve limpar busca ao fechar e reabrir', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Test',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    // Abrir e buscar
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    
    // Fechar
    await user.keyboard('{Escape}');
    
    // Reabrir
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    
    // Input deve estar vazio
    const searchInput = screen.getByPlaceholderText(/buscar conversas/i);
    expect(searchInput).toHaveValue('');
    
    // Não deve haver resultados
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('deve lidar com erros na busca', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(conversationsService.search).mockRejectedValue(
      new Error('Network error')
    );
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    // Não deve quebrar a aplicação
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
  });

  it('deve usar atalho de teclado para abrir', async () => {
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    // Simular Cmd+K (ou Ctrl+K)
    await user.keyboard('{Meta>}k{/Meta}');
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar conversas/i)).toBeInTheDocument();
    });
  });

  it('deve formatar datas corretamente', async () => {
    vi.mocked(conversationsService.search).mockResolvedValue([
      {
        id: 'conv-1',
        title: 'Recent',
        created_at: new Date().toISOString(),
        user_id: 'user-1'
      },
      {
        id: 'conv-2',
        title: 'Old',
        created_at: '2023-01-01T00:00:00Z',
        user_id: 'user-1'
      }
    ]);
    
    vi.mocked(messagesService.search).mockResolvedValue([]);
    
    render(<SearchDialog open={false} onOpenChange={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.type(screen.getByPlaceholderText(/buscar conversas/i), 'test');
    
    await waitFor(() => {
      // Verificar formatação relativa para data recente
      expect(screen.getByText(/há alguns segundos|agora mesmo/i)).toBeInTheDocument();
      // Verificar formatação absoluta para data antiga
      expect(screen.getByText(/01\/01\/2023/)).toBeInTheDocument();
    });
  });
});