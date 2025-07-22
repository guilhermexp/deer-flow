import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"
import type { Message } from "~/core/messages"

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
  // Buscar mensagens de uma conversa
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
    
    return (data || []).map(convertSupabaseToMessage);
  },
  
  // Criar mensagem
  async createMessage(message: Message): Promise<Message> {
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
  },
  
  // Atualizar mensagem
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
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
  
  // Verificar se a tabela messages existe
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