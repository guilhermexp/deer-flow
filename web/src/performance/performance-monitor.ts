// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance Monitor Implementation

import type {
  PerformanceMetric,
  ApiCallMetric,
  PerformanceThreshold,
  PerformanceAlert
} from './types';
import { PERFORMANCE_THRESHOLDS, MONITORING_DEFAULTS, ENV_DETECTION } from './constants';
import { SimpleEventEmitter, formatDuration } from '../utils/performance-utils';

export interface PerformanceMonitorConfig {
  enableApiTracking: boolean;
  enablePerformanceObserver: boolean;
  enableResourceTiming: boolean;
  batchSize: number;
  flushInterval: number;
  alertThresholds: PerformanceThreshold[];
}

export class PerformanceMonitor extends SimpleEventEmitter {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetric[] = [];
  private apiCalls: ApiCallMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  private alertDebounce: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    super();

    this.config = {
      enableApiTracking: true,
      enablePerformanceObserver: ENV_DETECTION.SUPPORTS_PERFORMANCE_OBSERVER,
      enableResourceTiming: ENV_DETECTION.IS_BROWSER,
      batchSize: MONITORING_DEFAULTS.METRICS_BATCH_SIZE,
      flushInterval: MONITORING_DEFAULTS.METRICS_FLUSH_INTERVAL,
      alertThresholds: [
        {
          metric: 'api_response_time',
          warningValue: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME.WARNING,
          criticalValue: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME.CRITICAL,
          unit: 'ms'
        },
        {
          metric: 'calendar_load_time',
          warningValue: PERFORMANCE_THRESHOLDS.CALENDAR_LOAD_TIME.WARNING,
          criticalValue: PERFORMANCE_THRESHOLDS.CALENDAR_LOAD_TIME.CRITICAL,
          unit: 'ms'
        }
      ],
      ...config
    };

    this.initialize();
  }

  // ==================== Public Methods ====================

  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percentage' = 'count',
    tags: Record<string, string> = {}
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
      unit
    };

    this.metrics.push(metric);
    this.checkThresholds(metric);
    this.emit('metric:recorded', metric);

    // Auto-flush if batch is full
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    options: {
      requestSize?: number;
      responseSize?: number;
      cached?: boolean;
      retryCount?: number;
    } = {}
  ): void {
    if (!this.config.enableApiTracking) return;

    const apiCall: ApiCallMetric = {
      endpoint,
      method: method.toUpperCase(),
      statusCode,
      duration,
      requestSize: options.requestSize ?? 0,
      responseSize: options.responseSize ?? 0,
      timestamp: new Date(),
      success: statusCode >= 200 && statusCode < 300,
      cached: options.cached ?? false,
      retryCount: options.retryCount ?? 0
    };

    this.apiCalls.push(apiCall);
    this.emit('api_call:recorded', apiCall);

    // Record as general metric
    this.recordMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status: statusCode.toString(),
      cached: apiCall.cached.toString()
    });

    // Check for performance issues
    if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME.WARNING) {
      this.createAlert('api_response_time', duration, 'warning');
    }
    if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME.CRITICAL) {
      this.createAlert('api_response_time', duration, 'critical');
    }
  }

  recordCalendarLoad(duration: number, eventCount: number, cached: boolean): void {
    this.recordMetric('calendar_load_time', duration, 'ms', {
      event_count: eventCount.toString(),
      cached: cached.toString()
    });

    this.recordMetric('calendar_events_loaded', eventCount, 'count', {
      cached: cached.toString()
    });

    // Check thresholds
    if (duration > PERFORMANCE_THRESHOLDS.CALENDAR_LOAD_TIME.WARNING) {
      this.createAlert('calendar_load_time', duration, 'warning');
    }
    if (duration > PERFORMANCE_THRESHOLDS.CALENDAR_LOAD_TIME.CRITICAL) {
      this.createAlert('calendar_load_time', duration, 'critical');
    }
  }

  recordCachePerformance(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    duration: number,
    size?: number
  ): void {
    this.recordMetric(`cache_${operation}`, 1, 'count', {
      duration: duration.toString()
    });

    if (operation === 'set' && size) {
      this.recordMetric('cache_entry_size', size, 'bytes');
    }
  }

  measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = performance.now();

    return operation().then(
      result => {
        const duration = performance.now() - startTime;
        this.recordMetric(`operation_duration`, duration, 'ms', {
          operation: operationName,
          status: 'success',
          ...tags
        });
        return result;
      },
      error => {
        const duration = performance.now() - startTime;
        this.recordMetric(`operation_duration`, duration, 'ms', {
          operation: operationName,
          status: 'error',
          ...tags
        });
        throw error;
      }
    );
  }

  getMetrics(since?: Date): PerformanceMetric[] {
    if (!since) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => metric.timestamp >= since);
  }

  getApiCallMetrics(since?: Date): ApiCallMetric[] {
    if (!since) {
      return [...this.apiCalls];
    }

    return this.apiCalls.filter(call => call.timestamp >= since);
  }

  getAlerts(resolved: boolean = false): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert:resolved', alert);
      return true;
    }
    return false;
  }

  getStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentApiCalls = this.apiCalls.filter(call =>
      call.timestamp.getTime() > oneHourAgo
    );

    const totalApiCalls = recentApiCalls.length;
    const successfulCalls = recentApiCalls.filter(call => call.success).length;
    const cachedCalls = recentApiCalls.filter(call => call.cached).length;

    const avgResponseTime = totalApiCalls > 0
      ? recentApiCalls.reduce((sum, call) => sum + call.duration, 0) / totalApiCalls
      : 0;

    const errorRate = totalApiCalls > 0
      ? (totalApiCalls - successfulCalls) * (100 / totalApiCalls)
      : 0;

    const cacheHitRate = totalApiCalls > 0
      ? cachedCalls * (100 / totalApiCalls)
      : 0;

    return {
      totalMetrics: this.metrics.length,
      totalApiCalls,
      successRate: totalApiCalls > 0 ? successfulCalls * (100 / totalApiCalls) : 0,
      errorRate,
      avgResponseTime,
      cacheHitRate,
      activeAlerts: this.alerts.filter(a => !a.resolved).length,
      resolvedAlerts: this.alerts.filter(a => a.resolved).length
    };
  }

  flush(): void {
    if (this.metrics.length === 0 && this.apiCalls.length === 0) {
      return;
    }

    const metricsToFlush = [...this.metrics];
    const apiCallsToFlush = [...this.apiCalls];

    // Clear arrays
    this.metrics.length = 0;
    this.apiCalls.length = 0;

    this.emit('metrics:flush', {
      metrics: metricsToFlush,
      apiCalls: apiCallsToFlush,
      timestamp: new Date()
    });
  }

  // ==================== Private Methods ====================

  private initialize(): void {
    if (this.config.enablePerformanceObserver && ENV_DETECTION.SUPPORTS_PERFORMANCE_OBSERVER) {
      this.setupPerformanceObserver();
    }

    // Start auto-flush interval
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Record initial performance metrics
    if (ENV_DETECTION.IS_BROWSER) {
      this.recordInitialMetrics();
    }
  }

  private setupPerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          } else if (entry.entryType === 'resource') {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'measure') {
            this.recordMeasureMetrics(entry);
          }
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource', 'measure']
      });
    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
      this.config.enablePerformanceObserver = false;
    }
  }

  private recordInitialMetrics(): void {
    // Record memory usage if available
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
    }

    // Record connection information
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      this.recordMetric('connection_downlink', connection.downlink, 'count', {
        type: connection.effectiveType
      });
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    this.recordMetric('page_load_time', entry.loadEventEnd - entry.navigationStart, 'ms');
    this.recordMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.navigationStart, 'ms');
    this.recordMetric('first_contentful_paint', entry.loadEventStart - entry.navigationStart, 'ms');
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    if (entry.name.includes('/api/')) {
      // This is an API call
      const duration = entry.responseEnd - entry.requestStart;
      const size = entry.transferSize || 0;

      this.recordMetric('resource_load_time', duration, 'ms', {
        resource_type: 'api',
        resource_name: entry.name
      });

      this.recordMetric('resource_size', size, 'bytes', {
        resource_type: 'api',
        resource_name: entry.name
      });
    }
  }

  private recordMeasureMetrics(entry: PerformanceEntry): void {
    this.recordMetric(entry.name, entry.duration, 'ms', {
      entry_type: 'measure'
    });
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.config.alertThresholds.find(t => t.metric === metric.name);
    if (!threshold) return;

    let severity: 'warning' | 'critical' | null = null;

    if (metric.value >= threshold.criticalValue) {
      severity = 'critical';
    } else if (metric.value >= threshold.warningValue) {
      severity = 'warning';
    }

    if (severity) {
      this.createAlert(metric.name, metric.value, severity);
    }
  }

  private createAlert(
    metric: string,
    value: number,
    severity: 'warning' | 'critical'
  ): void {
    const alertKey = `${metric}:${severity}`;

    // Debounce alerts to avoid spam
    if (this.alertDebounce.has(alertKey)) {
      return;
    }

    const alert: PerformanceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric,
      value,
      threshold: severity === 'critical'
        ? this.config.alertThresholds.find(t => t.metric === metric)?.criticalValue ?? 0
        : this.config.alertThresholds.find(t => t.metric === metric)?.warningValue ?? 0,
      severity,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);

    // Set debounce timeout
    this.alertDebounce.set(alertKey, setTimeout(() => {
      this.alertDebounce.delete(alertKey);
    }, MONITORING_DEFAULTS.ALERT_DEBOUNCE_TIME));
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Clear debounce timeouts
    for (const timeout of this.alertDebounce.values()) {
      clearTimeout(timeout);
    }
    this.alertDebounce.clear();

    // Final flush
    this.flush();

    this.removeAllListeners();
  }
}

// Default instance
export const performanceMonitor = new PerformanceMonitor();
