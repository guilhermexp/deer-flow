"use client";

import { useSupabaseSync } from "~/hooks/use-supabase-sync";

import Main from "./main";

export default function ChatWithSupabase() {
  const { isSyncing, isAuthenticated } = useSupabaseSync();
  
  // Mostrar loading enquanto carrega
  if (isSyncing) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🦌</div>
          <div className="text-muted-foreground">Carregando chat...</div>
        </div>
      </div>
    );
  }
  
  // Mostrar mensagem se não autenticado
  if (!isAuthenticated) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-muted-foreground">Faça login para usar o chat</div>
        </div>
      </div>
    );
  }
  
  return <Main />;
}