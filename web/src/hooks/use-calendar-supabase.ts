import { useState, useEffect, useCallback } from 'react';

import type { CalendarEvent, NewEventFormData } from '~/components/jarvis/calendar/lib/types';
import { useUser } from '@clerk/nextjs';
import { calendarApiService as calendarService } from '~/services/api/calendar';

/**
 * Hook para gerenciar eventos de calendário via REST API
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

      const apiEvents = await calendarService.list({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      // Converter eventos da API para formato local
      const localEvents: CalendarEvent[] = apiEvents.map(apiEvent => {
        const eventDate = new Date(apiEvent.date);
        return {
          id: apiEvent.id.toString(),
          title: apiEvent.title,
          subtitle: apiEvent.description || undefined,
          time: eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          duration: 1, // Padrão
          color: (apiEvent.color as any) || 'blue',
          category: (apiEvent.category as any) || 'all',
          day: eventDate.getDay(),
          startHour: eventDate.getHours(),
          date: apiEvent.date
        };
      });

      console.log(`✅ ${localEvents.length} eventos carregados`);
      setEvents(localEvents);
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

      // Construir data/hora do evento
      const eventDateTime = new Date(newEventData.eventDate);
      eventDateTime.setHours(newEventData.startHour, 0, 0, 0);

      // Criar evento via API
      const apiEvent = await calendarService.create({
        title: newEventData.title,
        description: newEventData.subtitle,
        date: eventDateTime.toISOString(),
        category: newEventData.category,
        color: newEventData.color
      });

      // Converter para formato local
      const localEvent: CalendarEvent = {
        id: apiEvent.id.toString(),
        title: apiEvent.title,
        subtitle: apiEvent.description || undefined,
        time: eventDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duration: newEventData.duration,
        color: newEventData.color,
        category: newEventData.category,
        day: eventDateTime.getDay(),
        startHour: newEventData.startHour,
        date: apiEvent.date
      };

      setEvents(prev => [...prev, localEvent].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));

      return localEvent;
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

      // Converter updates para formato da API
      const apiUpdates: any = {};
      if (updates.title) apiUpdates.title = updates.title;
      if (updates.subtitle !== undefined) apiUpdates.description = updates.subtitle;
      if (updates.category) apiUpdates.category = updates.category;
      if (updates.color) apiUpdates.color = updates.color;
      if (updates.date) apiUpdates.date = updates.date;

      await calendarService.update(parseInt(eventId), apiUpdates);

      // Atualizar estado local
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));

      return { ...updates } as CalendarEvent;
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

      await calendarService.delete(parseInt(eventId));
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