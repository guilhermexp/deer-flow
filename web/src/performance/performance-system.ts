// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance System Integration - Main orchestrator for all performance components

import { CacheService } from '../cache/cache-service';
import { PerformanceMonitor } from './performance-monitor';
import { CalendarCacheManager } from './calendar-cache-manager';
import { ResourcePreloadOptimizer } from './resource-preload-optimizer';
import { ResilientApiClient } from '../api/resilient/resilient-api-client';
import { CircuitBreakerManager } from '../api/resilient/circuit-breaker';
import { AuthManager } from '../auth/auth-manager';
import { ErrorManager } from '../errors/error-manager';
import type { PerformanceConfig } from './types';
import { FEATURE_FLAGS, ENV_DETECTION } from './constants';

export interface PerformanceSystemConfig extends Partial<PerformanceConfig> {
  baseURL: string;
  refreshTokenUrl: string;
  loginUrl: string;
}

export class PerformanceSystem {
  // Core services
  public readonly cacheService: CacheService;
  public readonly performanceMonitor: PerformanceMonitor;
  public readonly circuitBreakerManager: CircuitBreakerManager;
  public readonly errorManager: ErrorManager;
  public readonly authManager: AuthManager;
  public readonly apiClient: ResilientApiClient;

  // Feature-specific managers
  public readonly calendarCacheManager: CalendarCacheManager;
  public readonly resourcePreloadOptimizer: ResourcePreloadOptimizer;

  private config: PerformanceSystemConfig;
  private isInitialized: boolean = false;

  constructor(config: PerformanceSystemConfig) {
    this.config = {
      cache: {
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100 * 1024 * 1024, // 100MB
        enableRedis: false, // Browser environment
        redisUrl: undefined
      },
      circuitBreaker: {
        defaultFailureThreshold: 5,
        defaultResetTimeout: 30 * 1000,
        defaultMonitoringPeriod: 60 * 1000
      },
      retry: {
        defaultMaxRetries: 3,
        defaultBaseDelay: 1000,
        defaultMaxDelay: 30 * 1000,
        defaultBackoffMultiplier: 2
      },
      monitoring: {
        enablePerformanceObserver: ENV_DETECTION.SUPPORTS_PERFORMANCE_OBSERVER,
        enableApiTracking: true,
        alertThresholds: []
      },
      preload: {
        maxUnusedTime: 5 * 1000,
        enableOptimization: true,
        enableCleanup: true
      },
      ...config
    };

    // Initialize core services
    this.cacheService = new CacheService({
      defaultTtl: this.config.cache.defaultTtl,
      maxSize: this.config.cache.maxSize,
      enableRedis: this.config.cache.enableRedis,
      enableLocalStorage: ENV_DETECTION.IS_BROWSER,
      enableMemoryCache: true
    });

    this.performanceMonitor = new PerformanceMonitor({
      enableApiTracking: this.config.monitoring.enableApiTracking,
      enablePerformanceObserver: this.config.monitoring.enablePerformanceObserver,
      alertThresholds: this.config.monitoring.alertThresholds
    });

    this.circuitBreakerManager = new CircuitBreakerManager();

    this.errorManager = new ErrorManager({
      performanceMonitor: this.performanceMonitor,
      enableErrorTracking: true,
      enableRecoveryActions: true
    });

    this.authManager = new AuthManager({
      cacheService: this.cacheService,
      refreshTokenUrl: this.config.refreshTokenUrl,
      loginUrl: this.config.loginUrl,
      enableTokenRefresh: true,
      enableRequestQueue: true
    });

    this.apiClient = new ResilientApiClient({
      baseURL: this.config.baseURL,
      circuitBreakerManager: this.circuitBreakerManager,
      performanceMonitor: this.performanceMonitor,
      enableCircuitBreaker: FEATURE_FLAGS.ENABLE_CIRCUIT_BREAKER,
      enableRetry: FEATURE_FLAGS.ENABLE_RETRY_LOGIC,
      enablePerformanceTracking: FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING,
      defaultRetryOptions: {
        maxRetries: this.config.retry.defaultMaxRetries,
        baseDelay: this.config.retry.defaultBaseDelay,
        maxDelay: this.config.retry.defaultMaxDelay,
        backoffMultiplier: this.config.retry.defaultBackoffMultiplier,
        retryableErrors: [408, 429, 500, 502, 503, 504]
      }
    });

    // Initialize feature-specific managers
    this.calendarCacheManager = new CalendarCacheManager({
      cacheService: this.cacheService,
      performanceMonitor: this.performanceMonitor,
      debounceDelay: 300,
      batchSize: 7,
      maxDateRangeDays: 31,
      negativeCacheDuration: 5 * 60 * 1000,
      prefetchBufferDays: 3,
      apiClient: this.apiClient
    });

    this.resourcePreloadOptimizer = new ResourcePreloadOptimizer({
      maxUnusedTime: this.config.preload.maxUnusedTime,
      enableOptimization: this.config.preload.enableOptimization,
      enableCleanup: this.config.preload.enableCleanup
    });

    this.setupEventHandlers();
  }

  // ==================== Initialization ====================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate environment
      if (!ENV_DETECTION.IS_BROWSER) {
        console.warn('PerformanceSystem: Some features require browser environment');
      }

      // Initialize preload optimization
      if (FEATURE_FLAGS.ENABLE_PRELOAD_OPTIMIZATION) {
        await this.resourcePreloadOptimizer.optimizePreloadDirectives();
      }

      // Start performance monitoring
      if (FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) {
        this.performanceMonitor.recordMetric('system_initialized', 1, 'count', {
          timestamp: new Date().toISOString()
        });
      }

      this.isInitialized = true;
      console.info('PerformanceSystem: Successfully initialized');
    } catch (error) {
      console.error('PerformanceSystem: Initialization failed:', error);
      this.errorManager.handleError(error as Error, {
        context: 'system_initialization'
      });
      throw error;
    }
  }

  // ==================== Public API ====================

  // Enhanced Calendar API
  async getCalendarEvents(startDate: Date, endDate: Date) {
    return this.calendarCacheManager.getEventsForDateRange(startDate, endDate);
  }

  async invalidateCalendarCache(dateRange?: { start: Date; end: Date }) {
    return this.calendarCacheManager.invalidateCache(dateRange);
  }

  // Enhanced API Client
  async get<T>(url: string, options?: any): Promise<T> {
    return this.executeWithAuth(() => this.apiClient.get<T>(url, options));
  }

  async post<T>(url: string, data?: any, options?: any): Promise<T> {
    return this.executeWithAuth(() => this.apiClient.post<T>(url, data, options));
  }

  async put<T>(url: string, data?: any, options?: any): Promise<T> {
    return this.executeWithAuth(() => this.apiClient.put<T>(url, data, options));
  }

  async delete<T>(url: string, options?: any): Promise<T> {
    return this.executeWithAuth(() => this.apiClient.delete<T>(url, options));
  }

  // Resource Management
  preloadResource(resource: { url: string; as: string; priority?: string }) {
    return this.resourcePreloadOptimizer.addPreload(resource as any);
  }

  cleanupUnusedPreloads() {
    return this.resourcePreloadOptimizer.removeUnusedPreloads();
  }

  // Error Handling
  handleError(error: Error, context?: Record<string, any>) {
    return this.errorManager.handleError(error, context);
  }

  getSystemStats() {
    return {
      cache: this.cacheService.getStats(),
      performance: this.performanceMonitor.getStats(),
      api: this.apiClient.getStats(),
      preload: this.resourcePreloadOptimizer.getPreloadMetrics(),
      errors: {
        active: this.errorManager.getActiveErrors().length,
        history: this.errorManager.getErrorHistory().length
      }
    };
  }

  // ==================== Private Methods ====================

  private async executeWithAuth<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await this.authManager.retryWithNewAuth(operation);
    } catch (error) {
      // Handle auth errors specifically
      const authResult = await this.authManager.handleAuthError(error as any);

      if (authResult.shouldRedirectToLogin) {
        // Let the error manager handle this
        this.errorManager.handleError(error as Error, {
          requiresAuth: true,
          authResult
        });
      }

      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Error manager events
    this.errorManager.on('auth:refresh_requested', async () => {
      try {
        await this.authManager.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    });

    this.errorManager.on('auth:login_requested', () => {
      // Redirect to login page
      if (ENV_DETECTION.IS_BROWSER) {
        window.location.href = this.config.loginUrl;
      }
    });

    this.errorManager.on('cache:fallback_requested', (data) => {
      // Try to serve from cache
      console.info('Serving from cache due to API failure:', data);
    });

    // Performance monitoring events
    this.performanceMonitor.on('alert:created', (alert) => {
      console.warn('Performance alert:', alert);

      // Handle critical performance issues
      if (alert.severity === 'critical') {
        this.errorManager.handleError(new Error(`Performance critical: ${alert.metric}`), {
          performanceAlert: alert
        });
      }
    });

    // Circuit breaker events
    this.circuitBreakerManager.on('circuit_breaker:state_change', (data) => {
      console.info('Circuit breaker state changed:', data);

      if (data.to === 'open') {
        this.errorManager.handleError(new Error(`Service ${data.stats.service} is unavailable`), {
          circuitBreaker: data.stats
        });
      }
    });

    // Cache events
    this.cacheService.on('cache:evict', (data) => {
      this.performanceMonitor.recordMetric('cache_eviction', 1, 'count', {
        reason: data.reason,
        key: data.key
      });
    });

    // Auth events
    this.authManager.on('auth:token_refresh_failed', (error) => {
      this.errorManager.handleError(error, {
        context: 'token_refresh'
      });
    });

    // Preload events
    this.resourcePreloadOptimizer.on('preload:unused_warning', (data) => {
      this.performanceMonitor.recordMetric('preload_warning', 1, 'count', {
        url: data.url,
        timeUnused: data.timeSincePreload.toString()
      });
    });
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    // Destroy all services in reverse order
    this.resourcePreloadOptimizer?.destroy();
    this.calendarCacheManager?.destroy();
    this.apiClient?.destroy();
    this.authManager?.destroy();
    this.errorManager?.destroy();
    this.circuitBreakerManager?.destroy();
    this.performanceMonitor?.destroy();
    this.cacheService?.destroy();

    this.isInitialized = false;
  }
}

// Singleton instance
let performanceSystemInstance: PerformanceSystem | null = null;

export function createPerformanceSystem(config: PerformanceSystemConfig): PerformanceSystem {
  if (performanceSystemInstance) {
    performanceSystemInstance.destroy();
  }

  performanceSystemInstance = new PerformanceSystem(config);
  return performanceSystemInstance;
}

export function getPerformanceSystem(): PerformanceSystem | null {
  return performanceSystemInstance;
}

// React hook for using performance system
export function usePerformanceSystem(): PerformanceSystem | null {
  return getPerformanceSystem();
}