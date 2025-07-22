"use client";

import { useEffect } from "react";
import { useChatSupabase } from "~/hooks/use-chat-supabase";
import { useStore } from "~/core/store";
import Main from "./main";

export default function ChatWithSupabase() {
  const chatSupabase = useChatSupabase();
  const store = useStore();
  
  // Sincronizar store com Supabase
  useEffect(() => {
    if (!chatSupabase.isAuthenticated) {
      console.log('⚠️ Chat: Usuário não autenticado');
      return;
    }
    
    console.log('🔄 Chat: Configurando integração com Supabase...');
    
    // Substituir as funções do store para salvar no Supabase
    const originalFunctions = {
      appendMessage: store.appendMessage,
      updateMessage: store.updateMessage,
      updateMessages: store.updateMessages,
    };
    
    // Override appendMessage
    store.appendMessage = async (message) => {
      // Salvar no store local primeiro
      originalFunctions.appendMessage(message);
      
      // Depois salvar no Supabase
      try {
        await chatSupabase.appendMessage(message);
        console.log('✅ Mensagem salva no Supabase');
      } catch (error) {
        console.error('❌ Erro ao salvar no Supabase:', error);
      }
    };
    
    // Override updateMessage
    store.updateMessage = async (message) => {
      // Atualizar no store local primeiro
      originalFunctions.updateMessage(message);
      
      // Depois atualizar no Supabase
      try {
        await chatSupabase.updateMessage(message);
      } catch (error) {
        console.error('❌ Erro ao atualizar no Supabase:', error);
      }
    };
    
    // Override updateMessages
    store.updateMessages = async (messages) => {
      // Atualizar no store local primeiro
      originalFunctions.updateMessages(messages);
      
      // Depois atualizar no Supabase
      try {
        await chatSupabase.updateMessages(messages);
      } catch (error) {
        console.error('❌ Erro ao atualizar mensagens no Supabase:', error);
      }
    };
    
    // Cleanup ao desmontar
    return () => {
      store.appendMessage = originalFunctions.appendMessage;
      store.updateMessage = originalFunctions.updateMessage;
      store.updateMessages = originalFunctions.updateMessages;
    };
  }, [chatSupabase.isAuthenticated]);
  
  // Mostrar loading enquanto carrega
  if (chatSupabase.loading) {
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
  if (!chatSupabase.isAuthenticated) {
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