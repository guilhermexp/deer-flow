/**
 * Hook para sincronizar store com Supabase usando eventos
 */

import { useEffect } from "react";

import { useAuth } from "~/core/contexts/auth-context";
import { useStore } from "~/core/store";
import { storeEvents } from "~/core/store/events";

import { useChatSupabase } from "./use-chat-supabase";
import { useRealtimeMessages, useRealtimeConversations } from "./use-realtime-messages";

export function useSupabaseSync() {
  const chatSupabase = useChatSupabase();
  const store = useStore();
  const { user } = useAuth();
  
  // Ativar real-time subscriptions
  const { isConnected: messagesConnected } = useRealtimeMessages(store.threadId);
  const { isConnected: conversationsConnected } = useRealtimeConversations(user?.id);
  
  useEffect(() => {
    if (!chatSupabase.isAuthenticated) {
      console.log('⚠️ Sync: Usuário não autenticado');
      return;
    }
    
    console.log('🔄 Sync: Configurando sincronização com Supabase...');
    
    // Registrar listeners para eventos do store
    const unsubscribers: (() => void)[] = [];
    
    // Listener para MESSAGE_APPENDED
    unsubscribers.push(
      storeEvents.on('MESSAGE_APPENDED', async (event) => {
        if (event.type !== 'MESSAGE_APPENDED') return;
        
        try {
          await chatSupabase.appendMessage(event.message);
          console.log('✅ Mensagem salva no Supabase');
        } catch (error) {
          console.error('❌ Erro ao salvar no Supabase:', error);
          storeEvents.emit({ 
            type: 'SYNC_ERROR', 
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      })
    );
    
    // Listener para MESSAGE_UPDATED
    unsubscribers.push(
      storeEvents.on('MESSAGE_UPDATED', async (event) => {
        if (event.type !== 'MESSAGE_UPDATED') return;
        
        try {
          await chatSupabase.updateMessage(event.message);
          console.log('✅ Mensagem atualizada no Supabase');
        } catch (error) {
          console.error('❌ Erro ao atualizar no Supabase:', error);
          storeEvents.emit({ 
            type: 'SYNC_ERROR', 
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      })
    );
    
    // Listener para MESSAGES_UPDATED
    unsubscribers.push(
      storeEvents.on('MESSAGES_UPDATED', async (event) => {
        if (event.type !== 'MESSAGES_UPDATED') return;
        
        try {
          await chatSupabase.updateMessages(event.messages);
          console.log('✅ Mensagens atualizadas no Supabase');
        } catch (error) {
          console.error('❌ Erro ao atualizar mensagens no Supabase:', error);
          storeEvents.emit({ 
            type: 'SYNC_ERROR', 
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      })
    );
    
    // Cleanup ao desmontar
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [chatSupabase.isAuthenticated]);
  
  return {
    isSyncing: chatSupabase.loading,
    isAuthenticated: chatSupabase.isAuthenticated,
    realtimeStatus: {
      messages: messagesConnected,
      conversations: conversationsConnected
    }
  };
}