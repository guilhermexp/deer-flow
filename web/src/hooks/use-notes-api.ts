"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createNotesApiService } from "~/services/api/notes"
import { useAuthenticatedApi } from "~/hooks/use-authenticated-api"

export interface Note {
  id: string
  title: string
  description: string
  source: "YouTube" | "Instagram" | "TikTok" | "Imagens" | "Arquivos"
  date: string
  tags: string[]
  mediaType: "video" | "image" | "file"
  mediaUrl: string
  youtubeId?: string
  duration?: string
  fileSize?: string
  aiSummary?: string
  transcript?: string
  podcastContent?: string
  webhookData?: {
    type: string
    originalUrl?: string
    processedAt: string
  }
  created_at?: string
  updated_at?: string
}

export const useNotesApi = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Use authenticated API client
  const authApi = useAuthenticatedApi()
  const notesApiService = useMemo(() => createNotesApiService(authApi), [authApi])

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notesApiService.list()
      const convertedNotes = data.map(note => ({
        id: note.id.toString(),
        title: note.title,
        description: note.content || '',
        source: (note.source as Note["source"]) || "Arquivos",
        date: note.created_at,
        tags: [],
        mediaType: 'file' as const,
        mediaUrl: note.source_url || '',
        transcript: note.transcript || undefined,
        aiSummary: note.summary || undefined,
        webhookData: note.metadata && note.metadata.type && note.metadata.processedAt 
          ? {
              type: note.metadata.type,
              originalUrl: note.metadata.originalUrl,
              processedAt: note.metadata.processedAt
            }
          : undefined
      }))
      setNotes(convertedNotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }, [notesApiService])

  const addNote = useCallback(async (newNote: Omit<Note, 'id'>) => {
    try {
      const apiData = {
        title: newNote.title,
        content: newNote.description,
        source: newNote.source,
        source_url: newNote.mediaUrl,
        transcript: newNote.transcript,
        summary: newNote.aiSummary,
        metadata: newNote.webhookData
      }
      const result = await notesApiService.create(apiData)
      const convertedResult = {
        id: result.id.toString(),
        title: result.title,
        description: result.content || '',
        source: (result.source as Note["source"]) || "Arquivos",
        date: result.created_at,
        tags: [],
        mediaType: 'file' as const,
        mediaUrl: result.source_url || '',
        transcript: result.transcript || undefined,
        aiSummary: result.summary || undefined,
        webhookData: result.metadata && result.metadata.type && result.metadata.processedAt 
          ? {
              type: result.metadata.type,
              originalUrl: result.metadata.originalUrl,
              processedAt: result.metadata.processedAt
            }
          : undefined
      }
      setNotes(prev => [...prev, convertedResult])
      return convertedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add note'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [notesApiService])

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const apiData: any = {}
      if (updates.title) apiData.title = updates.title
      if (updates.description !== undefined) apiData.content = updates.description
      if (updates.source) apiData.source = updates.source
      if (updates.mediaUrl) apiData.source_url = updates.mediaUrl
      if (updates.transcript) apiData.transcript = updates.transcript
      if (updates.aiSummary) apiData.summary = updates.aiSummary
      if (updates.webhookData) apiData.metadata = updates.webhookData
      
      const result = await notesApiService.update(parseInt(id), apiData)
      const convertedResult = {
        id: result.id.toString(),
        title: result.title,
        description: result.content || '',
        source: (result.source as Note["source"]) || "Arquivos",
        date: result.created_at,
        tags: [],
        mediaType: 'file' as const,
        mediaUrl: result.source_url || '',
        transcript: result.transcript || undefined,
        aiSummary: result.summary || undefined,
        webhookData: result.metadata && result.metadata.type && result.metadata.processedAt 
          ? {
              type: result.metadata.type,
              originalUrl: result.metadata.originalUrl,
              processedAt: result.metadata.processedAt
            }
          : undefined
      }
      setNotes(prev => prev.map(note => 
        note.id === id ? convertedResult : note
      ))
      return convertedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [notesApiService])

  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesApiService.delete(parseInt(id))
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [notesApiService])

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return { 
    notes, 
    addNote, 
    updateNote,
    deleteNote,
    loading, 
    error,
    isAuthenticated,
    reloadNotes: loadNotes 
  }
}
