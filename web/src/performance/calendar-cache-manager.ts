// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Calendar Cache Manager Implementation with Debouncing and Batch Processing

import type {
  CalendarEvent,
  DateRange,
  CalendarCacheManager as ICalendarCacheManager,
  CacheStats
} from './types';
import type { CalendarEvent as ApiCalendarEvent } from '../core/api/calendar';
import { CacheService } from '../cache/cache-service';
import { PerformanceMonitor } from './performance-monitor';
import { CALENDAR_CONSTANTS, DEBOUNCE_DELAYS } from './constants';
import {
  debounce,
  createDateRange,
  isDateInRange,
  dateRangesOverlap,
  mergeDateRanges,
  expandDateRange,
  generateCacheKey,
  measurePerformance
} from '../utils/performance-utils';

export interface CalendarCacheManagerConfig {
  cacheService: CacheService;
  performanceMonitor: PerformanceMonitor;
  debounceDelay: number;
  batchSize: number;
  maxDateRangeDays: number;
  negativeCacheDuration: number;
  prefetchBufferDays: number;
  apiClient: any; // Will be injected
}

export class CalendarCacheManager implements ICalendarCacheManager {
  private config: CalendarCacheManagerConfig;
  private pendingRequests: Map<string, Promise<CalendarEvent[]>> = new Map();
  private batchQueue: Array<{ dateRange: DateRange; resolve: Function; reject: Function }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  // Debounced methods
  public readonly debouncedLoadEvents: (startDate: Date, endDate: Date) => Promise<CalendarEvent[]>;

  constructor(config: CalendarCacheManagerConfig) {
    this.config = config;

    // Create debounced version of load events
    this.debouncedLoadEvents = debounce(
      this.loadEventsInternal.bind(this),
      this.config.debounceDelay
    );
  }

  // ==================== Public Methods ====================

  async getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const dateRange = createDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey(dateRange);

    try {
      // Try to get from cache first
      const cached = await this.config.cacheService.get<CalendarEvent[]>(cacheKey);
      if (cached) {
        this.config.performanceMonitor.recordCachePerformance('hit', 0);
        this.config.performanceMonitor.recordCalendarLoad(0, cached.length, true);
        return cached;
      }

      this.config.performanceMonitor.recordCachePerformance('miss', 0);

      // Use debounced loading
      return await this.debouncedLoadEvents(startDate, endDate);
    } catch (error) {
      console.error('Error loading calendar events:', error);

      // Try to return stale cache if available
      const staleKey = `${cacheKey}:stale`;
      const stale = await this.config.cacheService.get<CalendarEvent[]>(staleKey);
      if (stale) {
        return stale;
      }

      throw error;
    }
  }

  async cacheEvents(dateRange: DateRange, events: CalendarEvent[]): Promise<void> {
    const cacheKey = this.generateCacheKey(dateRange);
    const staleKey = `${cacheKey}:stale`;

    try {
      // Cache the events with standard TTL
      await this.config.cacheService.set(cacheKey, events, {
        ttl: this.config.negativeCacheDuration,
        tags: ['calendar', 'events'],
        persistent: true
      });

      // Also cache as stale backup with longer TTL
      await this.config.cacheService.set(staleKey, events, {
        ttl: this.config.negativeCacheDuration * 3, // 3x longer for stale
        tags: ['calendar', 'events', 'stale'],
        persistent: true
      });

      this.config.performanceMonitor.recordCachePerformance('set', 0, events.length);
    } catch (error) {
      console.error('Error caching calendar events:', error);
    }
  }

  async invalidateCache(dateRange?: DateRange): Promise<void> {
    try {
      if (dateRange) {
        // Invalidate specific date range
        const cacheKey = this.generateCacheKey(dateRange);
        await this.config.cacheService.delete(cacheKey);
        await this.config.cacheService.delete(`${cacheKey}:stale`);
      } else {
        // Invalidate all calendar cache
        await this.config.cacheService.invalidate(['calendar', 'events']);
      }

      this.config.performanceMonitor.recordCachePerformance('delete', 0);
    } catch (error) {
      console.error('Error invalidating calendar cache:', error);
    }
  }

  async batchLoadDates(dates: Date[]): Promise<Map<Date, CalendarEvent[]>> {
    const result = new Map<Date, CalendarEvent[]>();

    if (dates.length === 0) {
      return result;
    }

    try {
      // Group dates into continuous ranges for efficient loading
      const ranges = this.groupDatesIntoRanges(dates);

      // Load each range
      const promises = ranges.map(async (range) => {
        const events = await this.getEventsForDateRange(range.start, range.end);
        return { range, events };
      });

      const results = await Promise.all(promises);

      // Distribute events to individual dates
      for (const { range, events } of results) {
        for (const date of dates) {
          if (isDateInRange(date, range)) {
            const dayEvents = events.filter(event =>
              this.isSameDay(new Date(event.startDate), date)
            );
            result.set(date, dayEvents);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error batch loading calendar events:', error);

      // Return empty results for each date
      dates.forEach(date => result.set(date, []));
      return result;
    }
  }

  getStats(): CacheStats {
    return this.config.cacheService.getStats();
  }

  // ==================== Private Methods ====================

  private async loadEventsInternal(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const dateRange = createDateRange(startDate, endDate);
    const requestKey = this.generateCacheKey(dateRange);

    // Check if we already have a pending request for this range
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    // Create the request promise
    const requestPromise = this.executeApiRequest(dateRange);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const events = await requestPromise;

      // Cache the successful result
      await this.cacheEvents(dateRange, events);

      // Prefetch adjacent ranges if the result is promising
      if (events.length > 0) {
        this.considerPrefetch(dateRange);
      }

      return events;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeApiRequest(dateRange: DateRange): Promise<CalendarEvent[]> {
    const { result, duration } = await measurePerformance(
      async () => {
        // Check if the date range is too large
        const daysDiff = Math.ceil(
          (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > this.config.maxDateRangeDays) {
          // Split into smaller chunks
          return this.loadLargeRange(dateRange);
        }

        // Load using the API client
        return this.loadFromApi(dateRange);
      },
      'calendar_api_request'
    );

    this.config.performanceMonitor.recordCalendarLoad(duration, result.length, false);
    return result;
  }

  private async loadFromApi(dateRange: DateRange): Promise<CalendarEvent[]> {
    try {
      // Convert dates to API format
      const startDateStr = dateRange.start.toISOString().split('T')[0];
      const endDateStr = dateRange.end.toISOString().split('T')[0];

      // Call the calendar API
      const apiEvents = await this.config.apiClient.getEvents({
        start_date: startDateStr,
        end_date: endDateStr
      });

      // Convert API events to internal format
      return apiEvents.map(this.convertApiEventToInternal);
    } catch (error) {
      console.error('API request failed:', error);

      // For empty results or certain errors, cache negative result
      if (this.isEmptyResultError(error)) {
        await this.cacheNegativeResult(dateRange);
        return [];
      }

      throw error;
    }
  }

  private async loadLargeRange(dateRange: DateRange): Promise<CalendarEvent[]> {
    const chunks = this.splitDateRangeIntoChunks(dateRange, this.config.maxDateRangeDays);
    const allEvents: CalendarEvent[] = [];

    for (const chunk of chunks) {
      try {
        const chunkEvents = await this.loadFromApi(chunk);
        allEvents.push(...chunkEvents);
      } catch (error) {
        console.warn('Failed to load chunk:', chunk, error);
        // Continue with other chunks
      }
    }

    return allEvents;
  }

  private async cacheNegativeResult(dateRange: DateRange): Promise<void> {
    // Cache empty result for shorter duration
    await this.cacheEvents(dateRange, []);
  }

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

  private generateCacheKey(dateRange: DateRange): string {
    return generateCacheKey('calendar_events', {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    });
  }

  private groupDatesIntoRanges(dates: Date[]): DateRange[] {
    if (dates.length === 0) return [];

    // Sort dates
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const ranges: DateRange[] = [];
    let currentRangeStart = sortedDates[0];
    let currentRangeEnd = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const daysDiff = Math.ceil(
        (date.getTime() - currentRangeEnd.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        // Consecutive or same day, extend current range
        currentRangeEnd = date;
      } else {
        // Gap found, finalize current range and start new one
        ranges.push(createDateRange(currentRangeStart, currentRangeEnd));
        currentRangeStart = date;
        currentRangeEnd = date;
      }
    }

    // Add the last range
    ranges.push(createDateRange(currentRangeStart, currentRangeEnd));

    return ranges;
  }

  private splitDateRangeIntoChunks(dateRange: DateRange, maxDays: number): DateRange[] {
    const chunks: DateRange[] = [];
    let currentStart = new Date(dateRange.start);

    while (currentStart < dateRange.end) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + maxDays);

      if (currentEnd > dateRange.end) {
        currentEnd.setTime(dateRange.end.getTime());
      }

      chunks.push(createDateRange(currentStart, currentEnd));

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }

    return chunks;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private isEmptyResultError(error: any): boolean {
    // Check if this is a "no events found" type error rather than a real failure
    if (error.status === 404) return true;
    if (error.message && error.message.toLowerCase().includes('no events')) return true;
    return false;
  }

  private considerPrefetch(dateRange: DateRange): void {
    // Prefetch adjacent ranges if we're not already loading them
    const expanded = expandDateRange(dateRange, this.config.prefetchBufferDays);

    // Prefetch before range
    const beforeRange = createDateRange(
      expanded.start,
      dateRange.start
    );

    // Prefetch after range
    const afterRange = createDateRange(
      dateRange.end,
      expanded.end
    );

    // Don't wait for prefetch to complete
    Promise.all([
      this.prefetchRange(beforeRange),
      this.prefetchRange(afterRange)
    ]).catch(error => {
      console.debug('Prefetch failed (this is not critical):', error);
    });
  }

  private async prefetchRange(dateRange: DateRange): Promise<void> {
    const cacheKey = this.generateCacheKey(dateRange);

    // Only prefetch if not already cached and not currently loading
    if (
      !this.pendingRequests.has(cacheKey) &&
      !(await this.config.cacheService.get(cacheKey))
    ) {
      try {
        await this.getEventsForDateRange(dateRange.start, dateRange.end);
      } catch (error) {
        // Ignore prefetch errors
        console.debug('Prefetch error (ignored):', error);
      }
    }
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    // Cancel debounced operations
    this.debouncedLoadEvents.cancel();

    // Clear pending requests
    this.pendingRequests.clear();

    // Clear batch queue
    this.batchQueue.length = 0;
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}