import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '~/core/contexts/auth-context';
import { notesService } from '~/services/supabase/notes';
import type { Note } from '~/app/(with-sidebar)/notes/page';

/**
 * Hook para gerenciar notas com Supabase
 */
export function useNotesSupabase() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar notas do Supabase
  const loadNotes = useCallback(async () => {
    if (!user?.id) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedNotes = await notesService.fetchNotes(user.id);
      setNotes(fetchedNotes);
      
      // Tentar migrar do localStorage se necessário
      await notesService.migrateFromLocalStorage(user.id);
      
      // Recarregar após migração
      const updatedNotes = await notesService.fetchNotes(user.id);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
      setError(err instanceof Error ? err : new Error('Erro ao carregar notas'));
      
      // Fallback para localStorage se Supabase falhar
      try {
        const stored = localStorage.getItem('jarvis-notes');
        if (stored) {
          const localNotes = JSON.parse(stored) as Note[];
          setNotes(localNotes);
          console.log('Usando notas do localStorage como fallback');
        }
      } catch (localErr) {
        console.error('Erro ao carregar fallback:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar notas ao montar ou quando o usuário mudar
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(async (note: Note) => {
    if (!user?.id) {
      console.error('Usuário não autenticado');
      return;
    }

    try {
      const createdNote = await notesService.createNote(note, user.id);
      setNotes((prevNotes) => [createdNote, ...prevNotes]);
    } catch (err) {
      console.error('Erro ao adicionar nota:', err);
      setError(err instanceof Error ? err : new Error('Erro ao adicionar nota'));
      
      // Fallback: adicionar localmente
      setNotes((prevNotes) => [note, ...prevNotes]);
    }
  }, [user?.id]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    if (!user?.id) {
      console.error('Usuário não autenticado');
      return;
    }

    try {
      const updatedNote = await notesService.updateNote(noteId, updates, user.id);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? updatedNote : note
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar nota:', err);
      setError(err instanceof Error ? err : new Error('Erro ao atualizar nota'));
      
      // Fallback: atualizar localmente
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, ...updates } : note
        )
      );
    }
  }, [user?.id]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!user?.id) {
      console.error('Usuário não autenticado');
      return;
    }

    try {
      await notesService.deleteNote(noteId, user.id);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error('Erro ao deletar nota:', err);
      setError(err instanceof Error ? err : new Error('Erro ao deletar nota'));
      
      // Fallback: deletar localmente
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    }
  }, [user?.id]);

  const findNoteById = useCallback((noteId: string): Note | undefined => {
    return notes.find((note) => note.id === noteId);
  }, [notes]);

  const refresh = useCallback(async () => {
    await loadNotes();
  }, [loadNotes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    findNoteById,
    refresh,
    isAuthenticated: !!user?.id
  };
}