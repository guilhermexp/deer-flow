import type { Message } from "~/core/messages"
import { getSupabaseClient } from "~/lib/supabase/client"
import { withRetry } from "~/lib/supabase/retry"
import type { Database } from "~/types/supabase"

type SupabaseMessage = Database['public']['Tables']['messages']['Row']
type SupabaseMessageInsert = Database['public']['Tables']['messages']['Insert']
type SupabaseMessageUpdate = Database['public']['Tables']['messages']['Update']

// Converter formato da aplicação para formato Supabase
export function convertMessageToSupabase(message: Message): SupabaseMessageInsert {
  return {
    id: message.id,
    conversation_id: message.threadId,
    content: message.content,
    role: message.role,
    agent: message.agent,
    finish_reason: message.finishReason,
    reasoning_content: message.reasoningContent,
    tool_calls: message.toolCalls ? JSON.stringify(message.toolCalls) : null,
    resources: message.resources ? JSON.stringify(message.resources) : null,
    metadata: message.options ? { options: message.options } : null
  }
}

// Converter formato Supabase para formato da aplicação
export function convertSupabaseToMessage(supabaseMessage: SupabaseMessage): Message {
  return {
    id: supabaseMessage.id,
    threadId: supabaseMessage.conversation_id,
    agent: supabaseMessage.agent || undefined,
    role: supabaseMessage.role,
    content: supabaseMessage.content || "",
    contentChunks: supabaseMessage.content ? [supabaseMessage.content] : [],
    reasoningContent: supabaseMessage.reasoning_content || undefined,
    reasoningContentChunks: supabaseMessage.reasoning_content ? [supabaseMessage.reasoning_content] : undefined,
    toolCalls: supabaseMessage.tool_calls ? JSON.parse(supabaseMessage.tool_calls as string) : undefined,
    finishReason: supabaseMessage.finish_reason as "stop" | "interrupt" | "tool_calls" | undefined,
    resources: supabaseMessage.resources ? JSON.parse(supabaseMessage.resources as string) : undefined,
    options: supabaseMessage.metadata?.options
  }
}

// Helper para obter o usuário atual
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Usuário não autenticado');
  }
  
  return session.user;
}

export const messagesService = {
  // Buscar mensagens de uma conversa com paginação
  async getConversationMessages(
    conversationId: string, 
    options?: {
      limit?: number;
      offset?: number;
      cursor?: string;
    }
  ): Promise<{
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const supabase = getSupabaseClient();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit + 1); // Busca um a mais para saber se há próxima página
    
    if (options?.cursor) {
      query = query.gt('created_at', options.cursor);
    } else if (offset > 0) {
      query = query.range(offset, offset + limit);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
    
    const messages = (data || []).slice(0, limit).map(convertSupabaseToMessage);
    const hasMore = (data || []).length > limit;
    const lastMessage = messages[messages.length - 1];
    
    return {
      messages,
      hasMore,
      nextCursor: hasMore && data ? data[limit - 1].created_at : undefined
    };
  },
  
  // Buscar todas as mensagens (retrocompatibilidade)
  async getAllConversationMessages(conversationId: string): Promise<Message[]> {
    const allMessages: Message[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const result = await this.getConversationMessages(conversationId, {
        limit: 100,
        cursor
      });
      
      allMessages.push(...result.messages);
      hasMore = result.hasMore;
      cursor = result.nextCursor;
    }
    
    return allMessages;
  },
  
  // Criar mensagem com retry automático
  async createMessage(message: Message): Promise<Message> {
    return withRetry(async () => {
      const supabase = getSupabaseClient();
      
      const supabaseMessage = convertMessageToSupabase(message);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(supabaseMessage)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar mensagem:', error);
        throw error;
      }
      
      return convertSupabaseToMessage(data);
    }, {
      maxRetries: 3,
      shouldRetry: (error) => {
        // Não fazer retry em erros de validação ou conflitos
        if (error?.code === '23505') return false; // Duplicate key
        if (error?.code === '23503') return false; // Foreign key violation
        if (error?.code === '23502') return false; // Not null violation
        return true;
      }
    });
  },
  
  // Atualizar mensagem com retry automático
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    return withRetry(async () => {
      const supabase = getSupabaseClient();
      
      const supabaseUpdates: SupabaseMessageUpdate = {};
      
      if (updates.content !== undefined) supabaseUpdates.content = updates.content;
      if (updates.reasoningContent !== undefined) supabaseUpdates.reasoning_content = updates.reasoningContent;
      if (updates.finishReason !== undefined) supabaseUpdates.finish_reason = updates.finishReason;
      if (updates.toolCalls !== undefined) supabaseUpdates.tool_calls = JSON.stringify(updates.toolCalls);
      
      const { data, error } = await supabase
        .from('messages')
        .update(supabaseUpdates)
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar mensagem:', error);
        throw error;
      }
      
      return convertSupabaseToMessage(data);
    });
  },
  
  // Criar múltiplas mensagens em lote
  async createMessages(messages: Message[]): Promise<Message[]> {
    if (messages.length === 0) return [];
    
    const supabase = getSupabaseClient();
    
    const supabaseMessages = messages.map(convertMessageToSupabase);
    
    const { data, error } = await supabase
      .from('messages')
      .insert(supabaseMessages)
      .select();
    
    if (error) {
      console.error('Erro ao criar mensagens em lote:', error);
      throw error;
    }
    
    return (data || []).map(convertSupabaseToMessage);
  },
  
  // Buscar mensagens por conteúdo
  async search(query: string, userId?: string): Promise<Message[]> {
    const supabase = getSupabaseClient();
    
    let dbQuery = supabase
      .from('messages')
      .select(`
        *,
        conversations!inner(user_id)
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (userId) {
      dbQuery = dbQuery.eq('conversations.user_id', userId);
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
    
    return (data || []).map(convertSupabaseToMessage);
  },

  // Verificar if a tabela messages existe
  async checkMessagesTableExists(): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('messages')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Erro ao verificar tabela messages:', error);
      return false;
    }
  }
};