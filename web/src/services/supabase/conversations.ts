// Conversations Service for Deep-flow

import { getSupabaseClient } from '~/lib/supabase/client'
import type { ConversationSummary, TablesInsert } from '~/types/supabase'

export const conversationsService = {
  // List user's conversations
  async list(userId: string, options?: { 
    limit?: number
    offset?: number
    archived?: boolean 
  }) {
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from('conversation_summary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.archived !== undefined) {
      query = query.eq('is_archived', options.archived)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as ConversationSummary[]
  },

  // Get single conversation
  async get(conversationId: string) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) throw error
    return data
  },

  // Get conversation by thread ID
  async getByThreadId(threadId: string) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('thread_id', threadId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    return data
  },

  // Create new conversation
  async create(conversation: TablesInsert<'conversations'>) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update conversation
  async update(conversationId: string, updates: {
    title?: string
    is_archived?: boolean
    metadata?: unknown
  }) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete conversation
  async delete(conversationId: string) {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error
  },

  // Archive/unarchive conversation
  async toggleArchive(conversationId: string, archived: boolean) {
    return this.update(conversationId, { is_archived: archived })
  },

  // Search conversations
  async search(userId: string, query: string) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,query.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  },

  // Subscribe to conversation changes
  subscribeToChanges(userId: string, callback: (payload: unknown) => void) {
    const supabase = getSupabaseClient()
    
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },

  // Get conversation statistics
  async getStats(userId: string) {
    const supabase = getSupabaseClient()
    
    const { error, count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error

    const { count: archivedCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', true)

    return {
      total: count ?? 0,
      active: (count ?? 0) - (archivedCount ?? 0),
      archived: archivedCount ?? 0,
    }
  },
}