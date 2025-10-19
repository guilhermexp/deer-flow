// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Performance Monitor Unit Tests

import { PerformanceMonitor } from '../performance-monitor';

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: any) => void;

  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }

  observe() {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }

  // Method to trigger callback for testing
  triggerEntries(entries: any[]) {
    this.callback({
      getEntries: () => entries
    });
  }
}

// Mock global PerformanceObserver
(global as any).PerformanceObserver = MockPerformanceObserver;

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      enableApiTracking: true,
      enablePerformanceObserver: false, // Disable for consistent testing
      batchSize: 5,
      flushInterval: 1000
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Metric Recording', () => {
    it('should record custom metrics', () => {
      monitor.recordMetric('test_metric', 42, 'count', { test: 'tag' });

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 42,
        unit: 'count',
        tags: { test: 'tag' }
      });
    });

    it('should record API call metrics', () => {
      monitor.recordApiCall('/api/test', 'GET', 200, 500, {
        requestSize: 100,
        responseSize: 200,
        cached: false,
        retryCount: 0
      });

      const apiCalls = monitor.getApiCallMetrics();
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]).toMatchObject({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 500,
        requestSize: 100,
        responseSize: 200,
        success: true,
        cached: false,
        retryCount: 0
      });

      // Should also record as general metric
      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'api_response_time')).toBe(true);
    });

    it('should record calendar load metrics', () => {
      monitor.recordCalendarLoad(300, 5, true);

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'calendar_load_time' && m.value === 300)).toBe(true);
      expect(metrics.some(m => m.name === 'calendar_events_loaded' && m.value === 5)).toBe(true);
    });

    it('should record cache performance metrics', () => {
      monitor.recordCachePerformance('hit', 50, 1024);

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'cache_hit' && m.value === 1)).toBe(true);
    });
  });

  describe('Performance Measurement', () => {
    it('should measure operation duration', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');

      const result = await monitor.measureOperation(
        'test_operation',
        mockOperation,
        { test: 'tag' }
      );

      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalledTimes(1);

      const metrics = monitor.getMetrics();
      expect(metrics.some(m =>
        m.name === 'operation_duration' &&
        m.tags.operation === 'test_operation' &&
        m.tags.status === 'success'
      )).toBe(true);
    });

    it('should measure failed operations', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(monitor.measureOperation('failing_operation', mockOperation))
        .rejects.toThrow('Test error');

      const metrics = monitor.getMetrics();
      expect(metrics.some(m =>
        m.name === 'operation_duration' &&
        m.tags.operation === 'failing_operation' &&
        m.tags.status === 'error'
      )).toBe(true);
    });
  });

  describe('Alerts', () => {
    it('should create alerts when thresholds are exceeded', () => {
      const alertSpy = jest.fn();
      monitor.on('alert:created', alertSpy);

      // Record metric that exceeds default warning threshold
      monitor.recordMetric('api_response_time', 2000); // 2 seconds

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: 'api_response_time',
          value: 2000,
          severity: 'warning'
        })
      );
    });

    it('should create critical alerts for high values', () => {
      const alertSpy = jest.fn();
      monitor.on('alert:created', alertSpy);

      // Record metric that exceeds critical threshold
      monitor.recordMetric('api_response_time', 5000); // 5 seconds

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: 'api_response_time',
          value: 5000,
          severity: 'critical'
        })
      );
    });

    it('should resolve alerts', () => {
      // Create an alert
      monitor.recordMetric('api_response_time', 2000);

      const alerts = monitor.getAlerts(false); // Get unresolved alerts
      expect(alerts).toHaveLength(1);

      const alertId = alerts[0].id;
      const resolved = monitor.resolveAlert(alertId);

      expect(resolved).toBe(true);
      expect(monitor.getAlerts(false)).toHaveLength(0); // No unresolved alerts
      expect(monitor.getAlerts(true)).toHaveLength(1); // One resolved alert
    });
  });

  describe('Batch Processing', () => {
    it('should auto-flush when batch size is reached', () => {
      const flushSpy = jest.fn();
      monitor.on('metrics:flush', flushSpy);

      // Record metrics up to batch size (5)
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric(`metric_${i}`, i);
      }

      expect(flushSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.arrayContaining([
            expect.objectContaining({ name: 'metric_0' }),
            expect.objectContaining({ name: 'metric_4' })
          ])
        })
      );
    });

    it('should flush manually', () => {
      const flushSpy = jest.fn();
      monitor.on('metrics:flush', flushSpy);

      monitor.recordMetric('test_metric', 1);
      monitor.recordApiCall('/test', 'GET', 200, 100);

      monitor.flush();

      expect(flushSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.arrayContaining([
            expect.objectContaining({ name: 'test_metric' })
          ]),
          apiCalls: expect.arrayContaining([
            expect.objectContaining({ endpoint: '/test' })
          ])
        })
      );

      // Metrics should be cleared after flush
      expect(monitor.getMetrics()).toHaveLength(0);
      expect(monitor.getApiCallMetrics()).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate performance statistics', () => {
      // Record some API calls with different outcomes
      monitor.recordApiCall('/api/success', 'GET', 200, 100, { cached: false });
      monitor.recordApiCall('/api/cached', 'GET', 200, 50, { cached: true });
      monitor.recordApiCall('/api/error', 'GET', 500, 200, { cached: false });

      const stats = monitor.getStats();

      expect(stats.totalApiCalls).toBe(3);
      expect(stats.successRate).toBe(200/3); // 2 out of 3 successful
      expect(stats.errorRate).toBe(100/3); // 1 out of 3 failed
      expect(stats.cacheHitRate).toBe(100/3); // 1 out of 3 cached
      expect(stats.avgResponseTime).toBeCloseTo(116.67); // (100 + 50 + 200) / 3
    });

    it('should handle empty statistics gracefully', () => {
      const stats = monitor.getStats();

      expect(stats.totalApiCalls).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.avgResponseTime).toBe(0);
    });
  });

  describe('Filtering', () => {
    it('should filter metrics by date', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      monitor.recordMetric('old_metric', 1);

      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        monitor.recordMetric('new_metric', 2);

        const recentMetrics = monitor.getMetrics(oneHourAgo);
        expect(recentMetrics.some(m => m.name === 'new_metric')).toBe(true);
      }, 10);
    });

    it('should filter API calls by date', () => {
      monitor.recordApiCall('/old', 'GET', 200, 100);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      setTimeout(() => {
        monitor.recordApiCall('/new', 'GET', 200, 100);

        const recentCalls = monitor.getApiCallMetrics(oneHourAgo);
        expect(recentCalls.some(c => c.endpoint === '/new')).toBe(true);
      }, 10);
    });
  });

  describe('Events', () => {
    it('should emit metric recorded events', () => {
      const metricSpy = jest.fn();
      monitor.on('metric:recorded', metricSpy);

      monitor.recordMetric('test_metric', 42);

      expect(metricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_metric',
          value: 42
        })
      );
    });

    it('should emit API call recorded events', () => {
      const apiSpy = jest.fn();
      monitor.on('api_call:recorded', apiSpy);

      monitor.recordApiCall('/test', 'GET', 200, 100);

      expect(apiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/test',
          method: 'GET',
          statusCode: 200
        })
      );
    });
  });
});