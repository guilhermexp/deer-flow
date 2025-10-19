"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { useState, useCallback } from "react";

import { useNotesApi } from "~/hooks/use-notes-api";
import {
  getSourceColor,
  getSourceIcon,
  createNoteFromWebhook,
} from "~/lib/notes-utils";
import { type ChatSession } from "~/lib/session-utils";
import { type WebhookResponse } from "~/lib/webhook-service";

// Dynamic imports for better code splitting
const NotesListView = dynamic(
  () =>
    import("~/components/jarvis/notes/notes-list-view").then(
      (mod) => mod.NotesListView
    ),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Carregando notas...
        </div>
      </div>
    ),
  }
);

const NotesDetailView = dynamic(
  () =>
    import("~/components/jarvis/notes/notes-detail-view").then(
      (mod) => mod.NotesDetailView
    ),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Carregando detalhes...
        </div>
      </div>
    ),
  }
);

export interface Note {
  id: string;
  title: string;
  description: string;
  source: "YouTube" | "Instagram" | "TikTok" | "Imagens" | "Arquivos";
  date: string;
  tags: string[];
  mediaType: "video" | "image" | "file";
  mediaUrl: string;
  youtubeId?: string;
  duration?: string;
  fileSize?: string;
  aiSummary?: string;
  transcript?: string;
  podcastContent?: string;
  webhookData?: {
    type: string;
    originalUrl?: string;
    processedAt: string;
  };
  chatSession?: ChatSession;
}

export interface NotesDashboardWithDetailsProps {
  className?: string;
}

export default function NotesDashboardWithDetails() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>(
    {}
  );

  // Use API hook for notes
  const { notes, loading, addNote, isAuthenticated } = useNotesApi();

  const handleNoteClick = useCallback(
    (note: Note) => {
      setSelectedNote(note);
    },
    [setSelectedNote]
  );

  const handleBackToDashboard = useCallback(() => {
    setSelectedNote(null);
  }, []);

   
  const handleSaveContext = useCallback(
    async (
      contextType: string,
      webhookResponse: WebhookResponse & { originalData?: any }
    ) => {
      console.log("🎯 handleSaveContext chamado:", {
        contextType,
        webhookResponse,
      });

      if (!webhookResponse.success) {
        console.error("Erro no processamento:", webhookResponse.error);
        return;
      }

      // Create new note from webhook response
      const newNote = createNoteFromWebhook(contextType, webhookResponse);
      console.log("📝 Nova nota criada:", newNote);

      // Add new note to database
      await addNote(newNote);

      // Automatically select new note to show details
      setSelectedNote(newNote);
    },
    [addNote]
  );

  // Show loading skeleton while notes are loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-pulse">
            <div className="mx-auto mb-4 h-4 w-48 rounded bg-white/10"></div>
            <div className="mx-auto h-4 w-32 rounded bg-white/5"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-gray-400">
            <p className="mb-2 text-lg font-medium">
              Faça login para acessar suas notas
            </p>
            <p className="text-sm">
              Suas notas serão sincronizadas automaticamente
            </p>
          </div>
        </div>
      </div>
    );
  }

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
    );
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
  );
}
