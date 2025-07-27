import type { Note } from "~/app/(with-sidebar)/notes/page"
import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"

type SupabaseNote = Database['public']['Tables']['notes']['Row']
type SupabaseNoteInsert = Database['public']['Tables']['notes']['Insert']
type SupabaseNoteUpdate = Database['public']['Tables']['notes']['Update']

// Converter Note do app para formato Supabase
export function convertNoteToSupabase(note: Note, userId: string): SupabaseNoteInsert {
  return {
    id: note.id,
    title: note.title,
    content: note.description,
    source: note.source,
    source_url: note.webhookData?.originalUrl || note.mediaUrl,
    summary: note.aiSummary,
    transcript: note.transcript,
    metadata: {
      tags: note.tags,
      mediaType: note.mediaType,
      youtubeId: note.youtubeId,
      duration: note.duration,
      fileSize: note.fileSize,
      podcastContent: note.podcastContent,
      webhookData: note.webhookData,
      date: note.date
    },
    user_id: userId
  }
}

// Converter de Supabase para formato do app
export function convertSupabaseToNote(supabaseNote: SupabaseNote): Note {
  const metadata = supabaseNote.metadata as any || {}
  
  return {
    id: supabaseNote.id,
    title: supabaseNote.title,
    description: supabaseNote.content || "",
    source: (supabaseNote.source || "Arquivos") as Note['source'],
    date: metadata.date || new Date(supabaseNote.created_at || '').toLocaleDateString('pt-BR'),
    tags: metadata.tags || [],
    mediaType: metadata.mediaType || "file",
    mediaUrl: supabaseNote.source_url || "",
    youtubeId: metadata.youtubeId,
    duration: metadata.duration,
    fileSize: metadata.fileSize,
    aiSummary: supabaseNote.summary,
    transcript: supabaseNote.transcript,
    podcastContent: metadata.podcastContent,
    webhookData: metadata.webhookData
  }
}

// Tipos para sessões de chat
type SupabaseNoteSession = Database['public']['Tables']['note_sessions']['Row']
type SupabaseNoteSessionInsert = Database['public']['Tables']['note_sessions']['Insert']
type SupabaseNoteMessage = Database['public']['Tables']['note_messages']['Row']
type SupabaseNoteMessageInsert = Database['public']['Tables']['note_messages']['Insert']

export const notesService = {
  // Buscar todas as notas do usuário
  async fetchNotes(userId: string): Promise<Note[]> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar notas:', error)
      throw error
    }
    
    return (data || []).map(convertSupabaseToNote)
  },
  
  // Buscar uma nota específica
  async fetchNoteById(noteId: string, userId: string): Promise<Note | null> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Erro ao buscar nota:', error)
      throw error
    }
    
    return data ? convertSupabaseToNote(data) : null
  },
  
  // Criar nova nota
  async createNote(note: Note, userId: string): Promise<Note> {
    const supabase = getSupabaseClient()
    
    const supabaseNote = convertNoteToSupabase(note, userId)
    
    const { data, error } = await supabase
      .from('notes')
      .insert(supabaseNote)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar nota:', error)
      throw error
    }
    
    return convertSupabaseToNote(data)
  },
  
  // Atualizar nota
  async updateNote(noteId: string, updates: Partial<Note>, userId: string): Promise<Note> {
    const supabase = getSupabaseClient()
    
    const supabaseUpdate: SupabaseNoteUpdate = {}
    
    if (updates.title !== undefined) supabaseUpdate.title = updates.title
    if (updates.description !== undefined) supabaseUpdate.content = updates.description
    if (updates.source !== undefined) supabaseUpdate.source = updates.source
    if (updates.mediaUrl !== undefined) supabaseUpdate.source_url = updates.mediaUrl
    if (updates.aiSummary !== undefined) supabaseUpdate.summary = updates.aiSummary
    if (updates.transcript !== undefined) supabaseUpdate.transcript = updates.transcript
    
    // Atualizar metadata
    if (updates.tags || updates.mediaType || updates.youtubeId || updates.duration || 
        updates.fileSize || updates.podcastContent || updates.webhookData || updates.date) {
      const { data: currentNote } = await supabase
        .from('notes')
        .select('metadata')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single()
      
      const currentMetadata = (currentNote?.metadata as any) || {}
      
      supabaseUpdate.metadata = {
        ...currentMetadata,
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.mediaType && { mediaType: updates.mediaType }),
        ...(updates.youtubeId && { youtubeId: updates.youtubeId }),
        ...(updates.duration && { duration: updates.duration }),
        ...(updates.fileSize && { fileSize: updates.fileSize }),
        ...(updates.podcastContent && { podcastContent: updates.podcastContent }),
        ...(updates.webhookData && { webhookData: updates.webhookData }),
        ...(updates.date && { date: updates.date })
      }
    }
    
    supabaseUpdate.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('notes')
      .update(supabaseUpdate)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar nota:', error)
      throw error
    }
    
    return convertSupabaseToNote(data)
  },
  
  // Deletar nota
  async deleteNote(noteId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId)
    
    if (error) {
      console.error('Erro ao deletar nota:', error)
      throw error
    }
  },
  
  // Migrar notas do localStorage para Supabase
  async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const NOTES_STORAGE_KEY = 'jarvis-notes'
      const stored = localStorage.getItem(NOTES_STORAGE_KEY)
      
      if (!stored) return
      
      const localNotes = JSON.parse(stored) as Note[]
      
      if (localNotes.length === 0) return
      
      console.log(`Migrando ${localNotes.length} notas para o Supabase...`)
      
      // Buscar notas existentes para evitar duplicatas
      const existingNotes = await this.fetchNotes(userId)
      const existingIds = new Set(existingNotes.map(n => n.id))
      
      // Filtrar apenas notas que não existem
      const notesToMigrate = localNotes.filter(note => !existingIds.has(note.id))
      
      if (notesToMigrate.length === 0) {
        console.log('Todas as notas já foram migradas')
        return
      }
      
      // Migrar em lote
      const supabase = getSupabaseClient()
      const supabaseNotes = notesToMigrate.map(note => convertNoteToSupabase(note, userId))
      
      const { error } = await supabase
        .from('notes')
        .insert(supabaseNotes)
      
      if (error) {
        console.error('Erro ao migrar notas:', error)
        throw error
      }
      
      console.log(`${notesToMigrate.length} notas migradas com sucesso`)
      
      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem(NOTES_STORAGE_KEY)
    } catch (error) {
      console.error('Erro na migração:', error)
      // Não lançar erro para não quebrar a aplicação
    }
  },

  // ===== SESSÕES DE CHAT =====
  
  // Buscar sessões de uma nota
  async fetchNoteSessions(noteId: string): Promise<SupabaseNoteSession[]> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('note_sessions')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar sessões:', error)
      throw error
    }
    
    return data || []
  },
  
  // Criar nova sessão
  async createNoteSession(noteId: string, sessionName: string): Promise<SupabaseNoteSession> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('note_sessions')
      .insert({
        note_id: noteId,
        session_name: sessionName
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar sessão:', error)
      throw error
    }
    
    return data
  },
  
  // Buscar mensagens de uma sessão
  async fetchSessionMessages(sessionId: string): Promise<SupabaseNoteMessage[]> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('note_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      throw error
    }
    
    return data || []
  },
  
  // Adicionar mensagem à sessão
  async addMessageToSession(sessionId: string, content: string, role: 'user' | 'assistant'): Promise<SupabaseNoteMessage> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('note_messages')
      .insert({
        session_id: sessionId,
        content,
        role
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao adicionar mensagem:', error)
      throw error
    }
    
    // Atualizar updated_at da sessão
    await supabase
      .from('note_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    
    return data
  }
}