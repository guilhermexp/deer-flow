/**
 * Serviço de eventos de calendário usando REST API
 */

import type { AuthenticatedApiClient } from '~/hooks/use-authenticated-api';

import { api } from './http-client';

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  category: string | null;
  color: string;
  location: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string | null;
  date: string;
  end_date?: string | null;
  category?: string | null;
  color?: string;
  location?: string | null;
  is_all_day?: boolean;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  date?: string;
  end_date?: string | null;
  category?: string | null;
  color?: string;
  location?: string | null;
  is_all_day?: boolean;
}

/**
 * Create calendar API service with authentication
 * Use this factory function with the useAuthenticatedApi hook
 */
export function createCalendarApiService(apiClient: AuthenticatedApiClient) {
  return {
    /**
     * Listar eventos do calendário
     */
    async list(params?: {
      start_date?: string;
      end_date?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }): Promise<CalendarEvent[]> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());

        const query = queryParams.toString();
        const endpoint = query ? `/calendar/events?${query}` : '/calendar/events';

        return await apiClient.get<CalendarEvent[]>(endpoint);
      } catch (error) {
        console.error('Erro ao listar eventos:', error);
        return [];
      }
    },

    /**
     * Buscar evento por ID
     */
    async get(id: number): Promise<CalendarEvent | null> {
      try {
        const event = await apiClient.get<CalendarEvent>(`/calendar/events/${id}`);
        return event;
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        return null;
      }
    },

    /**
     * Criar novo evento
     */
    async create(data: CalendarEventCreate): Promise<CalendarEvent> {
      return await apiClient.post<CalendarEvent>('/calendar/events', data);
    },

    /**
     * Atualizar evento
     */
    async update(id: number, data: CalendarEventUpdate): Promise<CalendarEvent> {
      return await apiClient.put<CalendarEvent>(`/calendar/events/${id}`, data);
    },

    /**
     * Deletar evento
     */
    async delete(id: number): Promise<void> {
      await apiClient.delete(`/calendar/events/${id}`);
    },

    /**
     * Buscar eventos de um mês específico
     */
    async getByMonth(year: number, month: number): Promise<CalendarEvent[]> {
      try {
        return await apiClient.get<CalendarEvent[]>(
          `/calendar/events/month/${year}/${month}`
        );
      } catch (error) {
        console.error('Erro ao buscar eventos do mês:', error);
        return [];
      }
    },

    /**
     * Verificar se tabela existe (compatibilidade com código antigo)
     * No REST API, sempre retorna true
     */
    async checkCalendarEventsTableExists(): Promise<boolean> {
      return true;
    }
  };
}

// Legacy service without authentication (deprecated)
// Use createCalendarApiService with useAuthenticatedApi hook instead
export const calendarApiService = {
  /**
   * Listar eventos do calendário
   */
  async list(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<CalendarEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/calendar/events?${query}` : '/calendar/events';

      return await api.get<CalendarEvent[]>(endpoint);
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      return [];
    }
  },

  /**
   * Buscar evento por ID
   */
  async get(id: number): Promise<CalendarEvent | null> {
    try {
      const event = await api.get<CalendarEvent>(`/calendar/events/${id}`);
      return event;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  },

  /**
   * Criar novo evento
   */
  async create(data: CalendarEventCreate): Promise<CalendarEvent> {
    return await api.post<CalendarEvent>('/calendar/events', data);
  },

  /**
   * Atualizar evento
   */
  async update(id: number, data: CalendarEventUpdate): Promise<CalendarEvent> {
    return await api.put<CalendarEvent>(`/calendar/events/${id}`, data);
  },

  /**
   * Deletar evento
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/calendar/events/${id}`);
  },

  /**
   * Buscar eventos de um mês específico
   */
  async getByMonth(year: number, month: number): Promise<CalendarEvent[]> {
    try {
      return await api.get<CalendarEvent[]>(
        `/calendar/events/month/${year}/${month}`
      );
    } catch (error) {
      console.error('Erro ao buscar eventos do mês:', error);
      return [];
    }
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkCalendarEventsTableExists(): Promise<boolean> {
    return true;
  }
};
