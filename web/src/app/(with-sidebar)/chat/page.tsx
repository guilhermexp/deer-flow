// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import dynamic from "next/dynamic";

import { useStore } from "~/core/store";
import type { HistoryItem } from "~/core/store/history-store";

import { HistoryPanel } from "./components/history-panel";

const Main = dynamic(() => import("./chat-with-supabase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">🦌</div>
        <div className="text-muted-foreground">Carregando DeerFlow...</div>
      </div>
    </div>
  ),
});

export default function ChatPage() {
  const responding = useStore((state) => state.responding);
  const isLoadingHistory = useStore((state) => state.isLoadingHistory);
  const loadConversation = useStore((state) => state.loadConversation);
  
  const handleSelectQuery = (query: string) => {
    // Se não está respondendo, podemos enviar a nova query
    if (!responding) {
      // Disparar um evento customizado que será capturado pelo Main
      window.dispatchEvent(new CustomEvent('selectHistoryQuery', { 
        detail: { query } 
      }));
    }
  };

  const handleLoadConversation = (conversation: HistoryItem) => {
    // Se não está respondendo e há mensagens salvas, carregamos a conversa
    if (!responding && conversation.messages && conversation.threadId) {
      loadConversation(conversation.messages, conversation.threadId);
    }
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Loading overlay quando carregando histórico */}
      {isLoadingHistory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <div className="text-white text-lg">Carregando conversa...</div>
          </div>
        </div>
      )}
      
      {/* Botão de histórico no canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <HistoryPanel 
          onSelectQuery={handleSelectQuery} 
          onLoadConversation={handleLoadConversation}
        />
      </div>
      <Main />
    </div>
  );
}
