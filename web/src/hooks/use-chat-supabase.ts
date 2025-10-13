import { nanoid } from 'nanoid';
import { useState, useCallback } from 'react';

import { useUser } from '@clerk/nextjs';
import type { Message } from '~/core/messages';
import { addToHistory } from '~/core/store/history-store';
import { conversationsService } from '~/services/supabase/conversations';
import { messagesService } from '~/services/supabase/messages';

/**
 * Hook para gerenciar conversas e mensagens de chat com Supabase
 */
export function useChatSupabase() {
  const { user, isLoaded } = useUser();
  const isAuthenticated = isLoaded && !!user;
  const [threadId, setThreadId] = useState<string>(nanoid());
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [messageIds, setMessageIds] = useState<string[]>([]);
  // In development mode, start with loading: false to skip loading states
  const [loading, setLoading] = useState(process.env.NODE_ENV === 'development' ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Carregar mensagens de uma conversa
  const loadConversation = useCallback(async (conversationId: string) => {
    // In development mode, skip authentication checks
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Skipping conversation loading');
      setLoading(false);
      return [];
    }
    
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setIsLoadingHistory(true);
      setError(null);
      console.log(`🔄 Carregando conversa ${conversationId}...`);
      
      // Verificar se a tabela existe
      const tableExists = await messagesService.checkMessagesTableExists();
      
      if (!tableExists) {
        console.log('⚠️ Tabela messages não encontrada');
        throw new Error('Tabela messages não encontrada. Verifique se as tabelas do Supabase foram criadas corretamente.');
      }
      
      // Buscar conversa
      const conversation = await conversationsService.get(conversationId);
      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }
      
      // Buscar mensagens
      const fetchedMessages = await messagesService.getConversationMessages(conversationId);
      console.log(`✅ ${fetchedMessages.length} mensagens carregadas`);
      
      // Atualizar estado
      const messageMap = new Map<string, Message>();
      const ids: string[] = [];
      
      fetchedMessages.forEach(message => {
        messageMap.set(message.id, message);
        ids.push(message.id);
      });
      
      setThreadId(conversation.thread_id);
      setMessages(messageMap);
      setMessageIds(ids);
      
      return fetchedMessages;
    } catch (err) {
      console.error('❌ Erro ao carregar conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar conversa');
      return [];
    } finally {
      setIsLoadingHistory(false);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Carregar conversa por thread ID
  const loadConversationByThreadId = useCallback(async (threadId: string) => {
    // In development mode, skip authentication checks
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Skipping thread loading');
      setLoading(false);
      return [];
    }
    
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setIsLoadingHistory(true);
      setError(null);
      
      // Buscar conversa pelo thread ID
      const conversation = await conversationsService.getByThreadId(threadId);
      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }
      
      // Carregar mensagens
      return loadConversation(conversation.id);
    } catch (err) {
      console.error('❌ Erro ao carregar conversa por thread ID:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar conversa');
      return [];
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated, user?.id, loadConversation]);

  // Adicionar mensagem
  const appendMessage = useCallback(async (message: Message) => {
    // In development mode, just store locally
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Storing message locally only');
      setMessages(prev => new Map(prev).set(message.id, message));
      setMessageIds(prev => [...prev, message.id]);
      return message;
    }
    
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      // Verificar se a conversa existe
      let conversation = await conversationsService.getByThreadId(message.threadId);
      
      // Se não existir, criar nova conversa
      if (!conversation) {
        // Se for mensagem do usuário, usar como título e query
        let title = 'Nova conversa';
        let query = '';
        
        if (message.role === 'user') {
          title = message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content;
          query = message.content;
        }
        
        conversation = await conversationsService.create({
          thread_id: message.threadId,
          title,
          query,
          user_id: user.id
        });
        
        // Adicionar ao histórico local
        addToHistory(query, message.threadId);
      }
      
      // Salvar mensagem
      await messagesService.createMessage(message);
      
      // Atualizar estado local
      setMessages(prev => new Map(prev).set(message.id, message));
      setMessageIds(prev => [...prev, message.id]);
      
      return message;
    } catch (err) {
      console.error('❌ Erro ao adicionar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar mensagem');
      
      // Atualizar estado local mesmo em caso de erro
      setMessages(prev => new Map(prev).set(message.id, message));
      setMessageIds(prev => [...prev, message.id]);
      
      return message;
    }
  }, [isAuthenticated, user?.id]);

  // Atualizar mensagem
  const updateMessage = useCallback(async (message: Message) => {
    // In development mode, just update locally
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Updating message locally only');
      setMessages(prev => new Map(prev).set(message.id, message));
      return message;
    }
    
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      // Atualizar mensagem no Supabase
      await messagesService.updateMessage(message.id, message);
      
      // Atualizar estado local
      setMessages(prev => new Map(prev).set(message.id, message));
      
      return message;
    } catch (err) {
      console.error('❌ Erro ao atualizar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar mensagem');
      
      // Atualizar estado local mesmo em caso de erro
      setMessages(prev => new Map(prev).set(message.id, message));
      
      return message;
    }
  }, [isAuthenticated, user?.id]);

  // Atualizar múltiplas mensagens
  const updateMessages = useCallback(async (messagesToUpdate: Message[]) => {
    if (messagesToUpdate.length === 0) {
      return;
    }
    
    // In development mode, just update locally
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Updating messages locally only');
      const newMessages = new Map(messages);
      messagesToUpdate.forEach(message => {
        newMessages.set(message.id, message);
      });
      setMessages(newMessages);
      return;
    }
    
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      // Atualizar estado local
      const newMessages = new Map(messages);
      messagesToUpdate.forEach(message => {
        newMessages.set(message.id, message);
      });
      
      setMessages(newMessages);
      
      // Atualizar no Supabase em segundo plano
      messagesToUpdate.forEach(async message => {
        try {
          await messagesService.updateMessage(message.id, message);
        } catch (err) {
          console.error(`❌ Erro ao atualizar mensagem ${message.id}:`, err);
        }
      });
    } catch (err) {
      console.error('❌ Erro ao atualizar mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar mensagens');
    }
  }, [isAuthenticated, user?.id, messages]);

  // Limpar conversa
  const clearConversation = useCallback(() => {
    setThreadId(nanoid());
    setMessages(new Map());
    setMessageIds([]);
  }, []);

  return {
    threadId,
    messages,
    messageIds,
    loading,
    error,
    isLoadingHistory,
    loadConversation,
    loadConversationByThreadId,
    appendMessage,
    updateMessage,
    updateMessages,
    clearConversation,
    // In development mode, always consider authenticated
    isAuthenticated: process.env.NODE_ENV === 'development' ? true : isAuthenticated
  };
}