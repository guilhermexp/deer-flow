// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance & Reliability System - Main Export

// Core Types
export * from './types';
export * from './constants';

// Core Services
export { CacheService, cacheService } from '../cache/cache-service';
export { PerformanceMonitor, performanceMonitor } from './performance-monitor';
export { CalendarCacheManager } from './calendar-cache-manager';
export { ResourcePreloadOptimizer, resourcePreloadOptimizer } from './resource-preload-optimizer';

// API Resilience
export { CircuitBreaker, CircuitBreakerManager, circuitBreakerManager } from '../api/resilient/circuit-breaker';
export { ResilientApiClient } from '../api/resilient/resilient-api-client';

// Authentication
export { AuthManager } from '../auth/auth-manager';

// Error Management
export { ErrorManager } from '../errors/error-manager';
export { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../errors/components/error-boundary';
export { ErrorToast } from '../errors/components/error-toast';
export { ErrorDialog, OfflineIndicator } from '../errors/components/error-dialog';

// Main System
export { PerformanceSystem, createPerformanceSystem, getPerformanceSystem } from './performance-system';

// React Integration
export {
  PerformanceProvider,
  usePerformanceSystem,
  useEnhancedCalendarApi,
  useEnhancedApi,
  useErrorHandler as useErrorHandlerHook,
  usePerformanceMonitoring,
  withPerformanceMonitoring
} from './providers/performance-provider';

// Enhanced Integrations
export { EnhancedCalendarApiService, createEnhancedCalendarService } from './integrations/enhanced-calendar-api';

// Utilities
export * from '../utils/performance-utils';

// Default configuration
export const DEFAULT_PERFORMANCE_CONFIG = {
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 * 1024 * 1024, // 100MB
    enableRedis: false,
    redisUrl: undefined
  },
  circuitBreaker: {
    defaultFailureThreshold: 5,
    defaultResetTimeout: 30 * 1000, // 30 seconds
    defaultMonitoringPeriod: 60 * 1000 // 1 minute
  },
  retry: {
    defaultMaxRetries: 3,
    defaultBaseDelay: 1000, // 1 second
    defaultMaxDelay: 30 * 1000, // 30 seconds
    defaultBackoffMultiplier: 2
  },
  monitoring: {
    enablePerformanceObserver: typeof PerformanceObserver !== 'undefined',
    enableApiTracking: true,
    alertThresholds: [
      {
        metric: 'api_response_time',
        warningValue: 1000, // 1 second
        criticalValue: 3000, // 3 seconds
        unit: 'ms'
      },
      {
        metric: 'calendar_load_time',
        warningValue: 500, // 0.5 seconds
        criticalValue: 2000, // 2 seconds
        unit: 'ms'
      },
      {
        metric: 'cache_hit_rate',
        warningValue: 60, // 60%
        criticalValue: 40, // 40%
        unit: 'percentage'
      }
    ]
  },
  preload: {
    maxUnusedTime: 5 * 1000, // 5 seconds
    enableOptimization: true,
    enableCleanup: true
  }
} as const;