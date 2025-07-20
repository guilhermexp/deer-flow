// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from './client';

export interface Conversation {
  id: number;
  thread_id: string;
  title?: string;
  query?: string;
  messages: any[];
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  thread_id: string;
  title?: string;
  query?: string;
  messages?: any[];
  summary?: string;
}

export interface ConversationUpdate {
  title?: string;
  query?: string;
  messages?: any[];
  summary?: string;
}

export const conversationsApi = {
  async getConversations(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/conversations/', { params });
    return response.data;
  },

  async getConversation(threadId: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/conversations/${threadId}`);
    return response.data;
  },

  async createConversation(data: ConversationCreate): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/conversations/', data);
    return response.data;
  },

  async updateConversation(threadId: string, data: ConversationUpdate): Promise<Conversation> {
    const response = await apiClient.put<Conversation>(`/conversations/${threadId}`, data);
    return response.data;
  },

  async deleteConversation(threadId: string): Promise<void> {
    await apiClient.delete(`/conversations/${threadId}`);
  },

  async addMessages(threadId: string, messages: any[]): Promise<{ thread_id: string; message_count: number }> {
    const response = await apiClient.post<{ thread_id: string; message_count: number }>(
      `/conversations/${threadId}/messages`,
      messages
    );
    return response.data;
  },
};