/**
 * Serviço de notas usando REST API
 */

import type { AuthenticatedApiClient } from '~/hooks/use-authenticated-api';

import { api } from './http-client';

export interface Note {
  id: number;
  title: string;
  content: string | null;
  source: string | null;
  source_url: string | null;
  transcript: string | null;
  summary: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content?: string | null;
  source?: string | null;
  source_url?: string | null;
  transcript?: string | null;
  summary?: string | null;
  metadata?: Record<string, any> | null;
}

export interface NoteUpdate {
  title?: string;
  content?: string | null;
  source?: string | null;
  source_url?: string | null;
  transcript?: string | null;
  summary?: string | null;
  metadata?: Record<string, any> | null;
}

export interface NoteStats {
  total_notes: number;
  notes_by_source: Record<string, number>;
  recent_sources: string[];
}

export interface ExtractContentResponse {
  source: string;
  title: string;
  source_url: string;
  transcript: string;
  summary: string;
  metadata: Record<string, any>;
}

/**
 * Create notes API service with authentication
 * Use this factory function with the useAuthenticatedApi hook
 */
export function createNotesApiService(apiClient: AuthenticatedApiClient) {
  return {
    /**
     * Listar todas as notas do usuário
     */
    async list(params?: {
      search?: string;
      source?: string;
      limit?: number;
      offset?: number;
    }): Promise<Note[]> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.source) queryParams.append('source', params.source);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());

        const query = queryParams.toString();
        const endpoint = query ? `/notes?${query}` : '/notes';

        return await apiClient.get<Note[]>(endpoint);
      } catch (error) {
        console.error('Erro ao listar notas:', error);
        return [];
      }
    },

    /**
     * Buscar nota por ID
     */
    async get(id: number): Promise<Note | null> {
      try {
        const note = await apiClient.get<Note>(`/notes/${id}`);
        return note;
      } catch (error) {
        console.error('Erro ao buscar nota:', error);
        return null;
      }
    },

    /**
     * Criar nova nota
     */
    async create(data: NoteCreate): Promise<Note> {
      return await apiClient.post<Note>('/notes', data);
    },

    /**
     * Atualizar nota
     */
    async update(id: number, data: NoteUpdate): Promise<Note> {
      return await apiClient.put<Note>(`/notes/${id}`, data);
    },

    /**
     * Deletar nota
     */
    async delete(id: number): Promise<void> {
      await apiClient.delete(`/notes/${id}`);
    },

    /**
     * Buscar estatísticas das notas
     */
    async getStats(): Promise<NoteStats | null> {
      try {
        return await apiClient.get<NoteStats>('/notes/stats');
      } catch (error) {
        console.error('Erro ao buscar estatísticas das notas:', error);
        return null;
      }
    },

    /**
     * Extrair conteúdo de uma URL (YouTube, Instagram, TikTok, etc)
     */
    async extractContent(url: string): Promise<ExtractContentResponse | null> {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('url', url);

        return await apiClient.post<ExtractContentResponse>(
          `/notes/extract?${queryParams.toString()}`
        );
      } catch (error) {
        console.error('Erro ao extrair conteúdo:', error);
        return null;
      }
    },

    /**
     * Gerar ou regenerar resumo de uma nota
     */
    async summarize(noteId: number): Promise<{ note_id: number; summary: string } | null> {
      try {
        return await apiClient.post<{ note_id: number; summary: string }>(
          `/notes/summarize/${noteId}`
        );
      } catch (error) {
        console.error('Erro ao gerar resumo:', error);
        return null;
      }
    },

    /**
     * Verificar se tabela existe (compatibilidade com código antigo)
     * No REST API, sempre retorna true
     */
    async checkNotesTableExists(): Promise<boolean> {
      return true;
    }
  };
}

// Legacy service without authentication (deprecated)
// Use createNotesApiService with useAuthenticatedApi hook instead
export const notesApiService = {
  /**
   * Listar todas as notas do usuário
   */
  async list(params?: {
    search?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<Note[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.source) queryParams.append('source', params.source);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/notes?${query}` : '/notes';

      return await api.get<Note[]>(endpoint);
    } catch (error) {
      console.error('Erro ao listar notas:', error);
      return [];
    }
  },

  /**
   * Buscar nota por ID
   */
  async get(id: number): Promise<Note | null> {
    try {
      const note = await api.get<Note>(`/notes/${id}`);
      return note;
    } catch (error) {
      console.error('Erro ao buscar nota:', error);
      return null;
    }
  },

  /**
   * Criar nova nota
   */
  async create(data: NoteCreate): Promise<Note> {
    return await api.post<Note>('/notes', data);
  },

  /**
   * Atualizar nota
   */
  async update(id: number, data: NoteUpdate): Promise<Note> {
    return await api.put<Note>(`/notes/${id}`, data);
  },

  /**
   * Deletar nota
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  /**
   * Buscar estatísticas das notas
   */
  async getStats(): Promise<NoteStats | null> {
    try {
      return await api.get<NoteStats>('/notes/stats');
    } catch (error) {
      console.error('Erro ao buscar estatísticas das notas:', error);
      return null;
    }
  },

  /**
   * Extrair conteúdo de uma URL (YouTube, Instagram, TikTok, etc)
   */
  async extractContent(url: string): Promise<ExtractContentResponse | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('url', url);

      return await api.post<ExtractContentResponse>(
        `/notes/extract?${queryParams.toString()}`
      );
    } catch (error) {
      console.error('Erro ao extrair conteúdo:', error);
      return null;
    }
  },

  /**
   * Gerar ou regenerar resumo de uma nota
   */
  async summarize(noteId: number): Promise<{ note_id: number; summary: string } | null> {
    try {
      return await api.post<{ note_id: number; summary: string }>(
        `/notes/summarize/${noteId}`
      );
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return null;
    }
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkNotesTableExists(): Promise<boolean> {
    return true;
  }
};
