import { useState, useEffect, useCallback } from 'react';

import type { Note } from '~/app/(with-sidebar)/notes/page';
import { useUser } from '@clerk/nextjs';
import { notesApiService as notesService } from '~/services/api/notes';

/**
 * Hook para gerenciar notas via REST API
 */
export function useNotesSupabase() {
  const { user } = useUser();
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
      setError(null);
      console.log('🔄 Carregando notas para o usuário:', user.id);

      // Buscar notas via API
      const fetchedNotes = await notesService.list();
      console.log(`✅ ${fetchedNotes.length} notas carregadas`);
      setNotes(fetchedNotes)
    } catch (err) {
      console.error('❌ Erro ao carregar notas:', err);
      setError(err instanceof Error ? err : new Error('Erro ao carregar notas'));
      
      // Fallback para localStorage se Supabase falhar
      try {
        const stored = localStorage.getItem('jarvis-notes');
        if (stored) {
          const localNotes = JSON.parse(stored) as Note[];
          setNotes(localNotes);
          console.log('📝 Usando notas do localStorage como fallback');
        }
      } catch (localErr) {
        console.error('❌ Erro ao carregar fallback:', localErr);
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
      // Converter Note para formato da API (simplificado por enquanto)
      const createdNote = await notesService.create({
        title: note.title,
        content: note.description
      });
      // Adicionar nota original com ID da API
      setNotes((prevNotes) => [{ ...note, id: createdNote.id.toString() }, ...prevNotes]);
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
      const apiUpdates: any = {};
      if (updates.title) apiUpdates.title = updates.title;
      if (updates.description) apiUpdates.content = updates.description;

      await notesService.update(parseInt(noteId), apiUpdates);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, ...updates } : note
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
      await notesService.delete(parseInt(noteId));
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