"use client"

import dynamic from "next/dynamic"
import * as React from "react"
import { useState, useCallback, useEffect } from "react"

import {
  loadNotesFromStorage,
  saveNotesToStorage,
  getSourceColor,
  getSourceIcon,
  createNoteFromWebhook,
} from "~/lib/notes-utils"
import { type ChatSession } from "~/lib/session-utils"
import { type WebhookResponse } from "~/lib/webhook-service"

// Dynamic imports for better code splitting
const NotesListView = dynamic(
  () => import("~/components/jarvis/notes/notes-list-view").then(mod => mod.NotesListView),
  { 
    loading: () => <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Carregando notas...</div>
    </div>
  }
)

const NotesDetailView = dynamic(
  () => import("~/components/jarvis/notes/notes-detail-view").then(mod => mod.NotesDetailView),
  { 
    loading: () => <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Carregando detalhes...</div>
    </div>
  }
)

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
  chatSession?: ChatSession
}

export interface NotesDashboardWithDetailsProps {
  className?: string
}

export default function NotesDashboardWithDetails() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({})
  const [notes, setNotes] = useState<Note[]>([])

  // Load notes from localStorage on initialization
  useEffect(() => {
    const storedNotes = loadNotesFromStorage()
    setNotes(storedNotes)
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length >= 0) { // Allow empty array
      saveNotesToStorage(notes)
    }
  }, [notes])

  const handleNoteClick = useCallback(
    (note: Note) => {
      setSelectedNote(note)
    },
    [setSelectedNote],
  )

  const handleBackToDashboard = useCallback(() => {
    setSelectedNote(null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveContext = useCallback(async (contextType: string, webhookResponse: WebhookResponse & { originalData?: any }) => {
    if (!webhookResponse.success) {
      console.error('Erro no processamento:', webhookResponse.error)
      return
    }

    // Create new note from webhook response
    const newNote = createNoteFromWebhook(contextType, webhookResponse)

    // Add new note to list
    setNotes(prevNotes => {
      const updatedNotes = [newNote, ...prevNotes]
      return updatedNotes
    })
    
    // Automatically select new note to show details
    setSelectedNote(newNote)
  }, [])

  // Show list view if no note is selected
  if (!selectedNote) {
    return (
      <NotesListView
        notes={notes}
        selectedNote={selectedNote}
        onNoteClick={handleNoteClick}
        onSaveContext={handleSaveContext}
        getSourceIcon={getSourceIcon}
        getSourceColor={getSourceColor}
      />
    )
  }

  // Show detail view for selected note
  return (
    <NotesDetailView
      selectedNote={selectedNote}
      onBack={handleBackToDashboard}
      getSourceIcon={getSourceIcon}
      getSourceColor={getSourceColor}
      chatSessions={chatSessions}
      onChatSessionsUpdate={setChatSessions}
      onSaveContext={handleSaveContext}
    />
  )
}