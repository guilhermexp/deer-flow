// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Core Performance & Reliability Types

// ==================== Calendar Event Types ====================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  isRecurring: boolean;
  recurrenceRule?: string;
  category?: string;
  color: string;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ==================== Cache Types ====================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  source: 'api' | 'computed' | 'fallback';
  hitCount: number;
  lastAccessed: number;
  size: number;
  tags: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  persistent?: boolean;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

// ==================== API Error Types ====================

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  endpoint: string;
  timestamp: Date;
  retryable: boolean;
  context?: Record<string, any>;
  originalError?: Error;
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface ErrorHandlingStrategy {
  category: ErrorCategory;
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: RecoveryAction[];
  maxRetries: number;
}

export enum RecoveryAction {
  RETRY = 'retry',
  REFRESH_AUTH = 'refresh_auth',
  USE_CACHE = 'use_cache',
  SHOW_OFFLINE = 'show_offline',
  REDIRECT_LOGIN = 'redirect_login',
  CONTACT_SUPPORT = 'contact_support',
  WAIT_AND_RETRY = 'wait_and_retry'
}

// ==================== Circuit Breaker Types ====================

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  healthCheckInterval?: number;
  name: string;
}

export interface CircuitBreakerStats {
  service: string;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  totalRequests: number;
  failureRate: number;
}

// ==================== Retry Logic Types ====================

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: number[];
  retryCondition?: (error: ApiError) => boolean;
  onRetry?: (attempt: number, error: ApiError) => void;
}

export interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDelay: number;
  maxRetryDelay: number;
}

// ==================== Authentication Types ====================

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
  scope?: string[];
}

export interface AuthRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: any;
}

export interface AuthErrorResult {
  canRetry: boolean;
  shouldRefreshToken: boolean;
  shouldRedirectToLogin: boolean;
  newToken?: AuthToken;
  error?: ApiError;
}

// ==================== Performance Monitoring Types ====================

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
}

export interface ApiCallMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  success: boolean;
  cached: boolean;
  retryCount: number;
}

export interface PerformanceThreshold {
  metric: string;
  warningValue: number;
  criticalValue: number;
  unit: string;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

// ==================== Resource Preload Types ====================

export interface PreloadResource {
  url: string;
  as: 'script' | 'style' | 'image' | 'document' | 'font' | 'fetch';
  priority?: 'high' | 'low';
  timeout?: number;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
}

export interface PreloadValidationResult {
  resource: PreloadResource;
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  used: boolean;
  loadTime?: number;
}

export interface PreloadMetrics {
  resourceUrl: string;
  preloadTime: number;
  firstUseTime?: number;
  timeToFirstUse?: number;
  wastedBytes: number;
  effectiveness: 'high' | 'medium' | 'low' | 'unused';
}

// ==================== Calendar Cache Manager Types ====================

export interface CalendarCacheManager {
  getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  cacheEvents(dateRange: DateRange, events: CalendarEvent[]): void;
  invalidateCache(dateRange?: DateRange): void;
  debouncedLoadEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  batchLoadDates(dates: Date[]): Promise<Map<Date, CalendarEvent[]>>;
  getStats(): CacheStats;
}

// ==================== Resilient API Client Types ====================

export interface ResilientApiClient {
  executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string
  ): Promise<T>;

  executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;

  handleApiError(error: ApiError): ErrorHandlingStrategy;
  trackApiCall(endpoint: string, duration: number, success: boolean): void;
  getStats(): { circuitBreakers: CircuitBreakerStats[]; retryStats: RetryStats };
}

// ==================== Utility Types ====================

export type Debounced<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
  flush: () => ReturnType<T>;
};

export interface EventEmitter<T = any> {
  on(event: string, listener: (data: T) => void): void;
  off(event: string, listener: (data: T) => void): void;
  emit(event: string, data: T): void;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  uptime: number;
  details?: Record<string, any>;
}

// ==================== Configuration Types ====================

export interface PerformanceConfig {
  cache: {
    defaultTtl: number;
    maxSize: number;
    enableRedis: boolean;
    redisUrl?: string;
  };
  circuitBreaker: {
    defaultFailureThreshold: number;
    defaultResetTimeout: number;
    defaultMonitoringPeriod: number;
  };
  retry: {
    defaultMaxRetries: number;
    defaultBaseDelay: number;
    defaultMaxDelay: number;
    defaultBackoffMultiplier: number;
  };
  monitoring: {
    enablePerformanceObserver: boolean;
    enableApiTracking: boolean;
    alertThresholds: PerformanceThreshold[];
  };
  preload: {
    maxUnusedTime: number;
    enableOptimization: boolean;
    enableCleanup: boolean;
  };
}