/**
 * Hook para real-time subscriptions de mensagens
 * NOTA: Desabilitado após migração para Neon PostgreSQL direto (sem Neon PostgreSQL)
 */

import { useEffect } from "react";

import type { Message } from "~/core/messages";

export function useRealtimeMessages(conversationId: string | undefined) {
  useEffect(() => {
    // Real-time desabilitado após migração para Neon PostgreSQL
    console.log(
      "⚠️ Real-time subscriptions desabilitadas (migração para Neon)"
    );
    return;
  }, [conversationId]);

  return {
    isConnected: false,
  };
}

/**
 * Hook para real-time de conversas do usuário
 * NOTA: Desabilitado após migração para Neon PostgreSQL direto (sem Neon PostgreSQL)
 */
export function useRealtimeConversations(userId: string | undefined) {
  useEffect(() => {
    // Real-time desabilitado após migração para Neon PostgreSQL
    console.log(
      "⚠️ Real-time subscriptions desabilitadas (migração para Neon)"
    );
    return;
  }, [userId]);

  return {
    isConnected: false,
  };
}
