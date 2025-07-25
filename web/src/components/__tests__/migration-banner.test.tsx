/**
 * Testes para o componente MigrationBanner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MigrationBanner } from '../migration-banner';
import { migrateLocalStorageToSupabase } from '~/utils/migration/localStorage-to-supabase';

// Mock do serviço de migração
vi.mock('~/utils/migration/localStorage-to-supabase', () => ({
  migrateLocalStorageToSupabase: vi.fn()
}));

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('MigrationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  it('não deve renderizar se já foi descartado', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return 'true';
      return null;
    });

    const { container } = render(<MigrationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('não deve renderizar se não há dados no localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { container } = render(<MigrationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar banner quando há dados para migrar', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return JSON.stringify([{ id: '1' }]);
      return null;
    });

    render(<MigrationBanner />);
    
    expect(screen.getByText(/Migrar dados locais/i)).toBeInTheDocument();
    expect(screen.getByText(/dados salvos localmente/i)).toBeInTheDocument();
  });

  it('deve iniciar migração ao clicar no botão', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return JSON.stringify([{ id: '1' }]);
      return null;
    });

    vi.mocked(migrateLocalStorageToSupabase).mockResolvedValue({
      success: true,
      migratedThreads: 1,
      migratedMessages: 5
    });

    render(<MigrationBanner />);
    
    const migrateButton = screen.getByText(/Migrar agora/i);
    fireEvent.click(migrateButton);

    // Verificar estado de loading
    expect(screen.getByText(/Migrando.../i)).toBeInTheDocument();
    expect(migrateButton).toBeDisabled();

    // Aguardar conclusão
    await waitFor(() => {
      expect(screen.getByText(/Migração concluída/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1 conversas/i)).toBeInTheDocument();
    expect(screen.getByText(/5 mensagens/i)).toBeInTheDocument();
  });

  it('deve mostrar erro quando migração falha', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return JSON.stringify([{ id: '1' }]);
      return null;
    });

    vi.mocked(migrateLocalStorageToSupabase).mockResolvedValue({
      success: false,
      error: 'Falha na conexão'
    });

    render(<MigrationBanner />);
    
    const migrateButton = screen.getByText(/Migrar agora/i);
    fireEvent.click(migrateButton);

    await waitFor(() => {
      expect(screen.getByText(/Erro na migração/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Falha na conexão/i)).toBeInTheDocument();
  });

  it('deve descartar banner ao clicar em descartar', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return JSON.stringify([{ id: '1' }]);
      return null;
    });

    const { container } = render(<MigrationBanner />);
    
    const dismissButton = screen.getByRole('button', { name: /descartar/i });
    fireEvent.click(dismissButton);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'migrationBannerDismissed',
      'true'
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve descartar automaticamente após migração bem-sucedida', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return JSON.stringify([{ id: '1' }]);
      return null;
    });

    vi.mocked(migrateLocalStorageToSupabase).mockResolvedValue({
      success: true,
      migratedThreads: 1,
      migratedMessages: 5
    });

    vi.useFakeTimers();

    const { container } = render(<MigrationBanner />);
    
    const migrateButton = screen.getByText(/Migrar agora/i);
    fireEvent.click(migrateButton);

    await waitFor(() => {
      expect(screen.getByText(/Migração concluída/i)).toBeInTheDocument();
    });

    // Avançar 5 segundos
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'migrationBannerDismissed',
      'true'
    );

    vi.useRealTimers();
  });

  it('deve mostrar contagem correta de dados', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') {
        return JSON.stringify([
          { id: '1', messages: [{}, {}, {}] },
          { id: '2', messages: [{}, {}] }
        ]);
      }
      return null;
    });

    render(<MigrationBanner />);
    
    // 2 threads, 5 mensagens total
    expect(screen.getByText(/2 conversas e 5 mensagens/i)).toBeInTheDocument();
  });

  it('deve lidar com dados corrompidos no localStorage', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'migrationBannerDismissed') return null;
      if (key === 'deer-flow-threads') return 'invalid json';
      return null;
    });

    const { container } = render(<MigrationBanner />);
    expect(container.firstChild).toBeNull();
  });
});