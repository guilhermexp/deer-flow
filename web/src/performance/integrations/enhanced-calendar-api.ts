// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Enhanced Calendar API Integration with Performance Optimizations

import type { CalendarEvent as ApiCalendarEvent } from '../../core/api/calendar';
import type { CalendarEvent } from '../types';
import { PerformanceSystem } from '../performance-system';

export class EnhancedCalendarApiService {
  constructor(private performanceSystem: PerformanceSystem) {}

  // Enhanced API methods with caching and performance monitoring
  async getEvents(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<CalendarEvent[]> {
    // If we have start_date and end_date, use the cache manager
    if (params?.start_date && params?.end_date) {
      const startDate = new Date(params.start_date);
      const endDate = new Date(params.end_date);

      return this.performanceSystem.calendarCacheManager.getEventsForDateRange(
        startDate,
        endDate
      );
    }

    // Fallback to direct API call for other queries
    const apiEvents = await this.performanceSystem.get<ApiCalendarEvent[]>('/calendar/events', {
      params
    });

    return apiEvents.map(this.convertApiEventToInternal);
  }

  async getEvent(id: number): Promise<CalendarEvent> {
    const apiEvent = await this.performanceSystem.get<ApiCalendarEvent>(`/calendar/events/${id}`);
    return this.convertApiEventToInternal(apiEvent);
  }

  async createEvent(data: any): Promise<CalendarEvent> {
    const apiEvent = await this.performanceSystem.post<ApiCalendarEvent>('/calendar/events', data);

    // Invalidate cache for the event's date range
    if (apiEvent.date) {
      const eventDate = new Date(apiEvent.date);
      const startOfDay = new Date(eventDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(eventDate);
      endOfDay.setHours(23, 59, 59, 999);

      await this.performanceSystem.invalidateCalendarCache({
        start: startOfDay,
        end: endOfDay
      });
    }

    return this.convertApiEventToInternal(apiEvent);
  }

  async updateEvent(id: number, data: any): Promise<CalendarEvent> {
    const apiEvent = await this.performanceSystem.put<ApiCalendarEvent>(`/calendar/events/${id}`, data);

    // Invalidate cache for the event's date range
    if (apiEvent.date) {
      const eventDate = new Date(apiEvent.date);
      const startOfDay = new Date(eventDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(eventDate);
      endOfDay.setHours(23, 59, 59, 999);

      await this.performanceSystem.invalidateCalendarCache({
        start: startOfDay,
        end: endOfDay
      });
    }

    return this.convertApiEventToInternal(apiEvent);
  }

  async deleteEvent(id: number): Promise<void> {
    await this.performanceSystem.delete(`/calendar/events/${id}`);

    // For deletion, we could invalidate a broader range or just clear all cache
    // Since we don't know the event date without fetching it first
    await this.performanceSystem.invalidateCalendarCache();
  }

  async getEventsByMonth(year: number, month: number): Promise<CalendarEvent[]> {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    const endDate = new Date(year, month, 0); // Last day of the month

    return this.performanceSystem.calendarCacheManager.getEventsForDateRange(
      startDate,
      endDate
    );
  }

  // Batch operations for better performance
  async getEventsForMultipleDates(dates: Date[]): Promise<Map<Date, CalendarEvent[]>> {
    return this.performanceSystem.calendarCacheManager.batchLoadDates(dates);
  }

  // Utility methods
  private convertApiEventToInternal(apiEvent: ApiCalendarEvent): CalendarEvent {
    return {
      id: apiEvent.id.toString(),
      title: apiEvent.title,
      description: apiEvent.description,
      startDate: new Date(apiEvent.date),
      endDate: new Date(apiEvent.end_date || apiEvent.date),
      location: apiEvent.location,
      attendees: [], // API doesn't provide this currently
      isRecurring: false, // API doesn't provide this currently
      recurrenceRule: undefined,
      category: apiEvent.category,
      color: apiEvent.color,
      isAllDay: apiEvent.is_all_day,
      createdAt: new Date(apiEvent.created_at),
      updatedAt: new Date(apiEvent.updated_at)
    };
  }
}

// Factory function to create enhanced calendar service
export function createEnhancedCalendarService(performanceSystem: PerformanceSystem): EnhancedCalendarApiService {
  return new EnhancedCalendarApiService(performanceSystem);
}