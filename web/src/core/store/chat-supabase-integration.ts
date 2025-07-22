/**
 * Integração do chat store com Supabase
 * Este módulo conecta o store existente com o hook useChatSupabase
 */

import { useChatSupabase } from '~/hooks/use-chat-supabase';
import { useStore } from './store';
import type { Message } from '../messages';

// Singleton para o hook do Supabase
let supabaseHook: ReturnType<typeof useChatSupabase> | null = null;

export function initializeChatSupabase() {
  if (!supabaseHook) {
    console.log('🔄 Inicializando integração Chat + Supabase...');
  }
}

// Interceptar as funções do store para integrar com Supabase
export function setupChatSupabaseIntegration(hook: ReturnType<typeof useChatSupabase>) {
  supabaseHook = hook;
  
  // Substituir as funções do store
  const originalAppendMessage = useStore.getState().appendMessage;
  const originalUpdateMessage = useStore.getState().updateMessage;
  const originalUpdateMessages = useStore.getState().updateMessages;
  
  // Override appendMessage
  useStore.setState({
    appendMessage: async (message: Message) => {
      // Primeiro atualiza o store local
      originalAppendMessage(message);
      
      // Depois salva no Supabase
      if (supabaseHook?.appendMessage) {
        try {
          await supabaseHook.appendMessage(message);
          console.log('✅ Mensagem salva no Supabase:', message.id);
        } catch (error) {
          console.error('❌ Erro ao salvar mensagem no Supabase:', error);
        }
      }
    },
    
    updateMessage: async (message: Message) => {
      // Primeiro atualiza o store local
      originalUpdateMessage(message);
      
      // Depois atualiza no Supabase
      if (supabaseHook?.updateMessage) {
        try {
          await supabaseHook.updateMessage(message);
          console.log('✅ Mensagem atualizada no Supabase:', message.id);
        } catch (error) {
          console.error('❌ Erro ao atualizar mensagem no Supabase:', error);
        }
      }
    },
    
    updateMessages: async (messages: Message[]) => {
      // Primeiro atualiza o store local
      originalUpdateMessages(messages);
      
      // Depois atualiza no Supabase
      if (supabaseHook?.updateMessages) {
        try {
          await supabaseHook.updateMessages(messages);
          console.log('✅ Mensagens atualizadas no Supabase:', messages.length);
        } catch (error) {
          console.error('❌ Erro ao atualizar mensagens no Supabase:', error);
        }
      }
    }
  });
  
  console.log('✅ Integração Chat + Supabase configurada');
}

// Hook para usar em componentes React
export function useChatWithSupabase() {
  const hook = useChatSupabase();
  
  // Configurar integração quando o hook estiver pronto
  if (hook.isAuthenticated && !supabaseHook) {
    setupChatSupabaseIntegration(hook);
  }
  
  return {
    ...hook,
    // Adicionar métodos do store também
    store: useStore()
  };
}