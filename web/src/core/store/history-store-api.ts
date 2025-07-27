// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { create } from "zustand";

import { conversationsApi } from "../api/conversations";
import type { Conversation } from "../api/conversations";
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
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  addConversation: (item: Omit<HistoryItem, "id" | "timestamp">) => Promise<void>;
  updateConversationMessages: (threadId: string, messages: Message[]) => Promise<void>;
  removeConversation: (id: string, threadId?: string) => Promise<void>;
  clearHistory: () => void;
  getRecentConversations: (limit?: number) => HistoryItem[];
  getConversationByThreadId: (threadId: string) => HistoryItem | undefined;
}

// Convert API conversation to local history item
function convertApiToLocal(conv: Conversation): HistoryItem {
  return {
    id: conv.id.toString(),
    title: conv.title ?? conv.query ?? "Untitled",
    query: conv.query ?? "",
    timestamp: new Date(conv.updated_at).getTime(),
    threadId: conv.thread_id,
    messages: conv.messages as any,
    summary: conv.summary,
  };
}

export const useHistoryStoreApi = create<HistoryState>((set, get) => ({
  conversations: [],
  isLoading: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const apiConversations = await conversationsApi.getConversations({ limit: 100 });
      const localConversations = apiConversations.map(convertApiToLocal);
      set({ conversations: localConversations });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      set({ error: "Failed to load conversations" });
    } finally {
      set({ isLoading: false });
    }
  },

  addConversation: async (item) => {
    try {
      if (!item.threadId) {
        console.error("Cannot add conversation without threadId");
        return;
      }

      const apiConv = await conversationsApi.createConversation({
        thread_id: item.threadId,
        title: item.title,
        query: item.query,
        messages: item.messages as any ?? [],
        summary: item.summary,
      });

      const newItem = convertApiToLocal(apiConv);
      set((state) => ({
        conversations: [newItem, ...state.conversations],
      }));
    } catch (error) {
      console.error("Failed to add conversation:", error);
      // If API fails, add locally for now
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      set((state) => ({
        conversations: [newItem, ...state.conversations].slice(0, 100),
      }));
    }
  },

  updateConversationMessages: async (threadId, messages) => {
    try {
      // Limit messages to save
      const MAX_MESSAGES_TO_SAVE = 200;
      const messagesToSave = messages.length > MAX_MESSAGES_TO_SAVE 
        ? messages.slice(-MAX_MESSAGES_TO_SAVE)
        : messages;

      // Update via API
      await conversationsApi.updateConversation(threadId, {
        messages: messagesToSave,
      });

      // Update local state
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.threadId === threadId
            ? { ...conv, messages: messagesToSave }
            : conv
        ),
      }));
    } catch (error) {
      console.error("Failed to update conversation messages:", error);
      // Update locally even if API fails
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.threadId === threadId
            ? { ...conv, messages }
            : conv
        ),
      }));
    }
  },

  removeConversation: async (id, threadId) => {
    try {
      // If we have threadId, delete via API
      if (threadId) {
        await conversationsApi.deleteConversation(threadId);
      }
      
      // Remove from local state
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
      }));
    } catch (error) {
      console.error("Failed to remove conversation:", error);
      // Remove locally even if API fails
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
      }));
    }
  },

  clearHistory: () => {
    // Note: This only clears local state, not API data
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
}));

// Helper function to add to history
export const addToHistoryApi = async (query: string, threadId: string, fileName?: string) => {
  const store = useHistoryStoreApi.getState();
  
  // Generate title from query
  const title = query.length > 50 ? query.substring(0, 50) + "..." : query;
  
  await store.addConversation({
    title,
    query,
    threadId,
    fileName,
  });
};