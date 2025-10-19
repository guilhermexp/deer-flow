// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance Utility Functions

import type { Debounced, ApiError, ErrorCategory, DateRange } from '../performance/types';
import { ERROR_PATTERNS, RETRY_DEFAULTS } from '../performance/constants';

// ==================== Debounce Utility ====================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): Debounced<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise<ReturnType<T>>((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }) as Debounced<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      return func(...lastArgs);
    }
    throw new Error('No pending invocation to flush');
  };

  return debounced;
}

// ==================== Throttle Utility ====================

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastExecution = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution;

    if (timeSinceLastExecution >= delay) {
      lastExecution = now;
      return func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastExecution = Date.now();
        func(...args);
      }, delay - timeSinceLastExecution);
    }
  }) as T;
}

// ==================== Error Classification ====================

export function classifyError(error: Error | ApiError): ErrorCategory {
  const message = error.message.toLowerCase();

  if (ERROR_PATTERNS.NETWORK.test(message)) {
    return 'network' as ErrorCategory;
  }
  if (ERROR_PATTERNS.AUTHENTICATION.test(message)) {
    return 'authentication' as ErrorCategory;
  }
  if (ERROR_PATTERNS.RATE_LIMIT.test(message)) {
    return 'rate_limit' as ErrorCategory;
  }
  if (ERROR_PATTERNS.TIMEOUT.test(message)) {
    return 'timeout' as ErrorCategory;
  }
  if (ERROR_PATTERNS.SERVICE_UNAVAILABLE.test(message)) {
    return 'service_unavailable' as ErrorCategory;
  }

  // Check if it's an ApiError with status code
  if ('statusCode' in error) {
    const statusCode = error.statusCode;
    if (statusCode === 401 || statusCode === 403) {
      return 'authentication' as ErrorCategory;
    }
    if (statusCode === 429) {
      return 'rate_limit' as ErrorCategory;
    }
    if (statusCode >= 500) {
      return 'service_unavailable' as ErrorCategory;
    }
    if (statusCode >= 400 && statusCode < 500) {
      return 'validation' as ErrorCategory;
    }
  }

  return 'unknown' as ErrorCategory;
}

// ==================== Retry Utilities ====================

export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = RETRY_DEFAULTS.BASE_DELAY,
  backoffMultiplier: number = RETRY_DEFAULTS.BACKOFF_MULTIPLIER,
  maxDelay: number = RETRY_DEFAULTS.MAX_DELAY,
  jitterFactor: number = 0.1
): number {
  const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
  const jitter = exponentialDelay * jitterFactor * Math.random();
  const delayWithJitter = exponentialDelay + jitter;

  return Math.min(delayWithJitter, maxDelay);
}

export function isRetryableError(error: ApiError): boolean {
  const category = classifyError(error);

  // Network, timeout, and service unavailable errors are retryable
  if (['network', 'timeout', 'service_unavailable'].includes(category)) {
    return true;
  }

  // Rate limit errors are retryable with delay
  if (category === 'rate_limit') {
    return true;
  }

  // Check specific status codes
  if (error.statusCode) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.statusCode);
  }

  return false;
}

// ==================== Date Range Utilities ====================

export function createDateRange(start: Date, end: Date): DateRange {
  return {
    start: new Date(start.getTime()),
    end: new Date(end.getTime())
  };
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const time = date.getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}

export function dateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

export function mergeDateRanges(ranges: DateRange[]): DateRange[] {
  if (ranges.length === 0) return [];

  // Sort ranges by start date
  const sorted = ranges.sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: DateRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (dateRangesOverlap(last, current)) {
      // Merge overlapping ranges
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export function expandDateRange(range: DateRange, days: number): DateRange {
  const dayInMs = 24 * 60 * 60 * 1000;
  return {
    start: new Date(range.start.getTime() - (days * dayInMs)),
    end: new Date(range.end.getTime() + (days * dayInMs))
  };
}

// ==================== Cache Key Generation ====================

export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => {
    const value = params[key];
    if (value instanceof Date) {
      return `${key}:${value.toISOString()}`;
    }
    if (typeof value === 'object' && value !== null) {
      return `${key}:${JSON.stringify(value)}`;
    }
    return `${key}:${String(value)}`;
  });

  return `${prefix}:${keyParts.join('|')}`;
}

export function parseUrlParameters(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  } catch {
    return {};
  }
}

// ==================== Performance Measurement ====================

export function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();

  return operation().then(
    result => {
      const duration = performance.now() - startTime;
      return { result, duration };
    },
    error => {
      const duration = performance.now() - startTime;
      // Still record the duration even on error
      console.warn(`Operation "${operationName}" failed after ${duration}ms:`, error);
      throw error;
    }
  );
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(ms / 60000).toFixed(1)}m`;
}

// ==================== Promise Utilities ====================

export function timeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    })
  ]);
}

export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_DEFAULTS.MAX_RETRIES,
  baseDelay: number = RETRY_DEFAULTS.BASE_DELAY
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const executeAttempt = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          reject(error);
          return;
        }

        const delay = calculateRetryDelay(attempt - 1, baseDelay);
        setTimeout(executeAttempt, delay);
      }
    };

    executeAttempt();
  });
}

// ==================== Event Emitter ====================

export class SimpleEventEmitter<T = any> {
  private listeners: Map<string, Array<(data: T) => void>> = new Map();

  on(event: string, listener: (data: T) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data: T) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}