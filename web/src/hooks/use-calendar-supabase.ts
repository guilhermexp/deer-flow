import { useState, useEffect, useCallback } from 'react';

import type { CalendarEvent, NewEventFormData } from '~/components/jarvis/calendar/lib/types';
import { useUser } from '@clerk/nextjs';
import { calendarService } from '~/services/supabase/calendar';

/**
 * Hook para gerenciar eventos de calendário com Supabase
 */
export function useCalendarSupabase() {
  const { user, isLoaded } = useUser();
  const isAuthenticated = isLoaded && !!user;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar eventos do Supabase
  const loadEvents = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando eventos de calendário...');
      
      // Get events for the current month and surrounding months
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      
      console.log('📅 Buscando eventos de:', startDate.toISOString(), 'até:', endDate.toISOString());
      
      const fetchedEvents = await calendarService.getEvents({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      console.log(`✅ ${fetchedEvents.length} eventos carregados`);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('❌ Erro ao carregar eventos de calendário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos de calendário');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Carregar eventos ao montar ou quando o usuário mudar
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Adicionar evento
  const addEvent = useCallback(async (newEventData: NewEventFormData) => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    if (!newEventData.title.trim() || !newEventData.eventDate) {
      setError('Título e data são obrigatórios');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const createdEvent = await calendarService.createEvent(newEventData);
      setEvents(prev => [...prev, createdEvent].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      
      return createdEvent;
    } catch (err) {
      console.error('❌ Erro ao adicionar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar evento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Atualizar evento
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedEvent = await calendarService.updateEvent(eventId, updates);
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      
      return updatedEvent;
    } catch (err) {
      console.error('❌ Erro ao atualizar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Excluir evento
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      await calendarService.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao excluir evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    isAuthenticated
  };
}