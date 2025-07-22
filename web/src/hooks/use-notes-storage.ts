import { useState, useEffect } from 'react';

import type { Note } from '~/app/(with-sidebar)/notes/page';

const NOTES_STORAGE_KEY = 'jarvis-notes';

/**
 * Hook simplificado para gerenciar notas no localStorage
 */
export function useNotesStorage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar notas ao montar o componente
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(NOTES_STORAGE_KEY);
        if (stored) {
          const parsedNotes = JSON.parse(stored) as Note[];
          
          // Debug: Verificar notas do YouTube
          const youtubeNotes = parsedNotes.filter(note => note.source === 'YouTube');
          console.log('📱 Loaded YouTube notes:', youtubeNotes.map(note => ({
            id: note.id,
            title: note.title,
            youtubeId: note.youtubeId,
            mediaUrl: note.mediaUrl,
            mediaType: note.mediaType
          })));
          
          setNotes(parsedNotes);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
      setError(err instanceof Error ? err : new Error('Erro ao carregar notas'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar notas sempre que mudarem
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      } catch (err) {
        console.error('Erro ao salvar notas:', err);
        setError(err instanceof Error ? err : new Error('Erro ao salvar notas'));
      }
    }
  }, [notes, loading]);

  const addNote = (note: Note) => {
    console.log('➕ Adding note to storage:', {
      id: note.id,
      title: note.title,
      source: note.source,
      youtubeId: note.youtubeId,
      mediaUrl: note.mediaUrl,
      mediaType: note.mediaType
    });
    setNotes((prevNotes) => [note, ...prevNotes]);
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
  };

  const findNoteById = (noteId: string): Note | undefined => {
    return notes.find((note) => note.id === noteId);
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    findNoteById,
    refresh: () => {
      // Força reload das notas
      setLoading(true);
      setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(NOTES_STORAGE_KEY);
            if (stored) {
              const parsedNotes = JSON.parse(stored) as Note[];
              setNotes(parsedNotes);
            }
          }
        } catch (err) {
          console.error('Erro ao recarregar notas:', err);
          setError(err instanceof Error ? err : new Error('Erro ao recarregar notas'));
        } finally {
          setLoading(false);
        }
      }, 100);
    }
  };
}