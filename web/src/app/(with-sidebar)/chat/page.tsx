// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import dynamic from "next/dynamic";
import { useStore } from "~/core/store";
import { HistoryPanel } from "./components/history-panel";

const Main = dynamic(() => import("./main"), {
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
  
  const handleSelectQuery = (query: string) => {
    // Se não está respondendo, podemos enviar a nova query
    if (!responding) {
      // Disparar um evento customizado que será capturado pelo Main
      window.dispatchEvent(new CustomEvent('selectHistoryQuery', { 
        detail: { query } 
      }));
    }
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Botão de histórico no canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <HistoryPanel onSelectQuery={handleSelectQuery} />
      </div>
      <Main />
    </div>
  );
}
