// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryItem {
  id: string;
  title: string;
  query: string;
  timestamp: number;
  fileName?: string;
  summary?: string;
}

interface HistoryState {
  conversations: HistoryItem[];
  addConversation: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  removeConversation: (id: string) => void;
  clearHistory: () => void;
  getRecentConversations: (limit?: number) => HistoryItem[];
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
    }),
    {
      name: HISTORY_KEY,
    }
  )
);

// Helper function para adicionar ao histórico de forma simples
export const addToHistory = (query: string, fileName?: string) => {
  const store = useHistoryStore.getState();
  
  // Gerar um título a partir da query (primeiras 50 caracteres)
  const title = query.length > 50 ? query.substring(0, 50) + "..." : query;
  
  store.addConversation({
    title,
    query,
    fileName,
    summary: `Conversa iniciada em ${new Date().toLocaleString('pt-BR')}`,
  });
}; 