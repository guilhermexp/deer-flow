/**
 * Serviço de conversas usando REST API
 */

import { api } from "./http-client";

export interface Conversation {
  id: number;
  thread_id: string;
  title: string | null;
  query: string | null;
  messages: any[];
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  thread_id: string;
  title?: string | null;
  query?: string | null;
  messages?: any[];
  summary?: string | null;
}

export interface ConversationUpdate {
  title?: string | null;
  query?: string | null;
  messages?: any[];
  summary?: string | null;
}

export const conversationsApiService = {
  /**
   * Buscar conversa por ID
   */
  async get(id: string): Promise<Conversation | null> {
    try {
      const conversation = await api.get<Conversation>(`/conversations/${id}`);
      return conversation;
    } catch (error) {
      console.error("Erro ao buscar conversa:", error);
      return null;
    }
  },

  /**
   * Buscar conversa por thread_id
   */
  async getByThreadId(thread_id: string): Promise<Conversation | null> {
    try {
      const conversation = await api.get<Conversation>(
        `/conversations/${thread_id}`
      );
      return conversation;
    } catch (error) {
      console.error("Erro ao buscar conversa por thread_id:", error);
      return null;
    }
  },

  /**
   * Listar todas as conversas do usuário
   */
  async list(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    items: Conversation[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.per_page)
        queryParams.append("per_page", params.per_page.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/conversations?${query}` : "/conversations";

      return await api.get(endpoint);
    } catch (error) {
      console.error("Erro ao listar conversas:", error);
      return {
        items: [],
        total: 0,
        page: 1,
        per_page: 50,
        pages: 0,
      };
    }
  },

  /**
   * Criar nova conversa
   */
  async create(data: ConversationCreate): Promise<Conversation> {
    return await api.post<Conversation>("/conversations", data);
  },

  /**
   * Atualizar conversa
   */
  async update(
    thread_id: string,
    data: ConversationUpdate
  ): Promise<Conversation> {
    return await api.put<Conversation>(`/conversations/${thread_id}`, data);
  },

  /**
   * Deletar conversa
   */
  async delete(thread_id: string): Promise<void> {
    await api.delete(`/conversations/${thread_id}`);
  },

  /**
   * Adicionar mensagens a uma conversa
   */
  async addMessages(
    thread_id: string,
    messages: any[]
  ): Promise<{ thread_id: string; message_count: number }> {
    return await api.post(`/conversations/${thread_id}/messages`, messages);
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkConversationsTableExists(): Promise<boolean> {
    return true;
  },
};
