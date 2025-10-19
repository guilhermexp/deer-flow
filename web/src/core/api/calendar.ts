// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from "./client";

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  category?: string;
  color: string;
  location?: string;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  category?: string;
  color?: string;
  location?: string;
  is_all_day?: boolean;
}

export interface EventUpdate extends Partial<EventCreate> {}

export const calendarApi = {
  async getEvents(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>("/calendar/events", {
      params,
    });
    return response.data;
  },

  async getEvent(id: number): Promise<CalendarEvent> {
    const response = await apiClient.get<CalendarEvent>(
      `/calendar/events/${id}`
    );
    return response.data;
  },

  async createEvent(data: EventCreate): Promise<CalendarEvent> {
    const response = await apiClient.post<CalendarEvent>(
      "/calendar/events",
      data
    );
    return response.data;
  },

  async updateEvent(id: number, data: EventUpdate): Promise<CalendarEvent> {
    const response = await apiClient.put<CalendarEvent>(
      `/calendar/events/${id}`,
      data
    );
    return response.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete(`/calendar/events/${id}`);
  },

  async getEventsByMonth(
    year: number,
    month: number
  ): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>(
      `/calendar/events/month/${year}/${month}`
    );
    return response.data;
  },
};
