// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance & Reliability Constants

// ==================== Cache Constants ====================

export const CACHE_DEFAULTS = {
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  MAX_ENTRIES: 1000,
  NEGATIVE_CACHE_TTL: 5 * 60 * 1000, // 5 minutes for empty results
} as const;

export const CACHE_KEYS = {
  CALENDAR_EVENTS: 'calendar:events',
  AUTH_TOKEN: 'auth:token',
  USER_PREFERENCES: 'user:preferences',
  API_RESPONSES: 'api:responses',
} as const;

// ==================== Circuit Breaker Constants ====================

export const CIRCUIT_BREAKER_DEFAULTS = {
  FAILURE_THRESHOLD: 5,
  RESET_TIMEOUT: 30 * 1000, // 30 seconds
  MONITORING_PERIOD: 60 * 1000, // 1 minute
  HEALTH_CHECK_INTERVAL: 10 * 1000, // 10 seconds
} as const;

// ==================== Retry Constants ====================

export const RETRY_DEFAULTS = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 30 * 1000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
  JITTER_FACTOR: 0.1,
} as const;

// HTTP Status codes that are retryable
export const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
] as const;

// ==================== Performance Constants ====================

export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: {
    WARNING: 1000, // 1 second
    CRITICAL: 3000, // 3 seconds
  },
  CALENDAR_LOAD_TIME: {
    WARNING: 500, // 0.5 seconds
    CRITICAL: 2000, // 2 seconds
  },
  CACHE_HIT_RATE: {
    WARNING: 60, // 60%
    CRITICAL: 40, // 40%
  },
  ERROR_RATE: {
    WARNING: 1, // 1%
    CRITICAL: 5, // 5%
  },
} as const;

// ==================== Debounce Constants ====================

export const DEBOUNCE_DELAYS = {
  CALENDAR_LOAD: 300, // 300ms minimum delay
  API_CALLS: 250,
  SEARCH: 300,
  RESIZE: 100,
  SCROLL: 16, // ~60fps
} as const;

// ==================== Error Classification ====================

export const ERROR_PATTERNS = {
  NETWORK: /network|connection|fetch|cors/i,
  AUTHENTICATION: /auth|unauthorized|forbidden|token/i,
  RATE_LIMIT: /rate.?limit|too.?many.?requests/i,
  TIMEOUT: /timeout|timed.?out/i,
  SERVICE_UNAVAILABLE: /unavailable|maintenance|down/i,
} as const;

// ==================== Preload Constants ====================

export const PRELOAD_DEFAULTS = {
  MAX_UNUSED_TIME: 5 * 1000, // 5 seconds
  CLEANUP_INTERVAL: 30 * 1000, // 30 seconds
  WARNING_THRESHOLD: 3 * 1000, // 3 seconds
} as const;

// ==================== Authentication Constants ====================

export const AUTH_DEFAULTS = {
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_RETRY_ATTEMPTS: 2,
  QUEUE_TIMEOUT: 10 * 1000, // 10 seconds
} as const;

// ==================== Monitoring Constants ====================

export const MONITORING_DEFAULTS = {
  METRICS_BATCH_SIZE: 50,
  METRICS_FLUSH_INTERVAL: 10 * 1000, // 10 seconds
  PERFORMANCE_OBSERVER_BUFFER_SIZE: 100,
  ALERT_DEBOUNCE_TIME: 5 * 1000, // 5 seconds
} as const;

// ==================== Calendar Specific Constants ====================

export const CALENDAR_CONSTANTS = {
  DEFAULT_BATCH_SIZE: 7, // Load 7 days at a time
  MAX_DATE_RANGE_DAYS: 31, // Maximum 31 days per request
  NEGATIVE_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  PREFETCH_BUFFER_DAYS: 3, // Prefetch 3 days ahead
} as const;

// ==================== Feature Flags ====================

export const FEATURE_FLAGS = {
  ENABLE_CACHE: true,
  ENABLE_CIRCUIT_BREAKER: true,
  ENABLE_RETRY_LOGIC: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_PRELOAD_OPTIMIZATION: true,
  ENABLE_ERROR_RECOVERY: true,
  ENABLE_DEBUG_LOGGING: false,
} as const;

// ==================== Environment Detection ====================

export const ENV_DETECTION = {
  IS_BROWSER: typeof window !== 'undefined',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_PROD: process.env.NODE_ENV === 'production',
  SUPPORTS_SERVICE_WORKER: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  SUPPORTS_PERFORMANCE_OBSERVER: typeof PerformanceObserver !== 'undefined',
} as const;

// ==================== Event Names ====================

export const EVENTS = {
  CACHE_HIT: 'cache:hit',
  CACHE_MISS: 'cache:miss',
  CACHE_INVALIDATE: 'cache:invalidate',
  CIRCUIT_BREAKER_OPEN: 'circuit_breaker:open',
  CIRCUIT_BREAKER_CLOSE: 'circuit_breaker:close',
  CIRCUIT_BREAKER_HALF_OPEN: 'circuit_breaker:half_open',
  API_CALL_START: 'api_call:start',
  API_CALL_SUCCESS: 'api_call:success',
  API_CALL_ERROR: 'api_call:error',
  AUTH_TOKEN_REFRESH: 'auth:token_refresh',
  AUTH_ERROR: 'auth:error',
  PERFORMANCE_ALERT: 'performance:alert',
  PRELOAD_UNUSED: 'preload:unused',
  ERROR_RECOVERY: 'error:recovery',
} as const;