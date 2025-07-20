// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Message } from "../messages";

export interface HistoryItem {
  id: string;
  title: string;
  query: string;
  timestamp: number;
  fileName?: string;
  summary?: string;
  messages?: Message[];
  threadId?: string;
}

interface HistoryState {
  conversations: HistoryItem[];
  addConversation: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  updateConversationMessages: (threadId: string, messages: Message[]) => void;
  removeConversation: (id: string) => void;
  clearHistory: () => void;
  getRecentConversations: (limit?: number) => HistoryItem[];
  getConversationByThreadId: (threadId: string) => HistoryItem | undefined;
}

const HISTORY_KEY = "deerflow.history";

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      conversations: [],
      
      addConversation: (item) => {
        const newItem: HistoryItem = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          conversations: [newItem, ...state.conversations].slice(0, 100), // Keep only last 100 conversations
        }));
      },
      
      updateConversationMessages: (threadId, messages) => {
        // Limitar o número de mensagens salvas para evitar problemas de performance
        const MAX_MESSAGES_TO_SAVE = 200;
        const messagesToSave = messages.length > MAX_MESSAGES_TO_SAVE 
          ? messages.slice(-MAX_MESSAGES_TO_SAVE) // Pegar as últimas 200 mensagens
          : messages;
          
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.threadId === threadId
              ? { ...conv, messages: messagesToSave }
              : conv
          ),
        }));
      },
      
      removeConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
        }));
      },
      
      clearHistory: () => {
        set({ conversations: [] });
      },
      
      getRecentConversations: (limit = 10) => {
        return get().conversations
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      },
      
      getConversationByThreadId: (threadId) => {
        return get().conversations.find((conv) => conv.threadId === threadId);
      },
    }),
    {
      name: HISTORY_KEY,
    }
  )
);

// Helper function para adicionar ao histórico de forma simples
export const addToHistory = (query: string, threadId: string, fileName?: string) => {
  const store = useHistoryStore.getState();
  
  // Gerar um título a partir da query (primeiras 50 caracteres)
  const title = query.length > 50 ? query.substring(0, 50) + "..." : query;
  
  store.addConversation({
    title,
    query,
    threadId,
    fileName,
    summary: `Conversa iniciada em ${new Date().toLocaleString('pt-BR')}`,
  });
}; 