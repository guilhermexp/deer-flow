/**
 * Hook para real-time subscriptions de mensagens
 * NOTA: Desabilitado após migração para Neon PostgreSQL direto (sem Supabase)
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import type { Message } from '~/core/messages';
import { storeEvents } from '~/core/store/events';

export function useRealtimeMessages(conversationId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Real-time desabilitado após migração para Neon PostgreSQL
    console.log('⚠️ Real-time subscriptions desabilitadas (migração para Neon)');
    return;

    if (!conversationId) return;
    
    // Criar canal de real-time para a conversa
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔔 Nova mensagem recebida:', payload);
          
          // Converter e emitir evento para atualizar o store
          const message = convertSupabaseToMessage(payload.new as any);
          
          // Emitir evento customizado para notificar sobre nova mensagem externa
          storeEvents.emit({
            type: 'MESSAGE_APPENDED',
            message
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada:', payload);
          
          // Converter e emitir evento para atualizar o store
          const message = convertSupabaseToMessage(payload.new as any);
          
          storeEvents.emit({
            type: 'MESSAGE_UPDATED',
            message
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da conexão real-time: ${status}`);
      });
    
    channelRef.current = channel;
    
    // Cleanup ao desmontar
    return () => {
      console.log('🔌 Desconectando real-time...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);
  
  return {
    isConnected: channelRef.current?.state === 'subscribed'
  };
}

/**
 * Hook para real-time de conversas do usuário
 * NOTA: Desabilitado após migração para Neon PostgreSQL direto (sem Supabase)
 */
export function useRealtimeConversations(userId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Real-time desabilitado após migração para Neon PostgreSQL
    console.log('⚠️ Real-time subscriptions desabilitadas (migração para Neon)');
    return;

    if (!userId) return;
    
    // Criar canal para mudanças em conversas do usuário
    const channel = supabase
      .channel(`conversations:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Mudança em conversa:', payload);
          
          // Emitir evento baseado no tipo de mudança
          if (payload.eventType === 'INSERT') {
            storeEvents.emit({
              type: 'CONVERSATION_CREATED',
              conversationId: payload.new.id,
              title: payload.new.title
            });
          } else if (payload.eventType === 'UPDATE') {
            storeEvents.emit({
              type: 'CONVERSATION_UPDATED',
              conversationId: payload.new.id,
              updates: payload.new
            });
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);
  
  return {
    isConnected: channelRef.current?.state === 'subscribed'
  };
}