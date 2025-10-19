// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PerformanceSystem, createPerformanceSystem } from '../performance-system';
import { ErrorBoundary } from '../../errors/components/error-boundary';
import { ErrorToast } from '../../errors/components/error-toast';
import { OfflineIndicator } from '../../errors/components/error-dialog';

interface PerformanceProviderProps {
  children: ReactNode;
  config: {
    baseURL: string;
    refreshTokenUrl: string;
    loginUrl: string;
  };
  enableErrorUI?: boolean;
  enableOfflineDetection?: boolean;
}

const PerformanceContext = createContext<PerformanceSystem | null>(null);

export function PerformanceProvider({
  children,
  config,
  enableErrorUI = true,
  enableOfflineDetection = true
}: PerformanceProviderProps) {
  const [performanceSystem, setPerformanceSystem] = useState<PerformanceSystem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeSystem() {
      try {
        const system = createPerformanceSystem({
          baseURL: config.baseURL,
          refreshTokenUrl: config.refreshTokenUrl,
          loginUrl: config.loginUrl,
          // Additional configuration can be added here
          cache: {
            defaultTtl: 5 * 60 * 1000, // 5 minutes
            maxSize: 50 * 1024 * 1024, // 50MB for browser
            enableRedis: false
          },
          monitoring: {
            enablePerformanceObserver: true,
            enableApiTracking: true,
            alertThresholds: [
              {
                metric: 'api_response_time',
                warningValue: 1000,
                criticalValue: 3000,
                unit: 'ms'
              },
              {
                metric: 'calendar_load_time',
                warningValue: 500,
                criticalValue: 2000,
                unit: 'ms'
              }
            ]
          },
          preload: {
            maxUnusedTime: 5000,
            enableOptimization: true,
            enableCleanup: true
          }
        });

        await system.initialize();

        if (mounted) {
          setPerformanceSystem(system);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize PerformanceSystem:', error);
        if (mounted) {
          setInitError(error as Error);
        }
      }
    }

    initializeSystem();

    return () => {
      mounted = false;
      if (performanceSystem) {
        performanceSystem.destroy();
      }
    };
  }, [config]);

  // Show loading state during initialization
  if (!isInitialized && !initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing performance system...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Initialization Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The performance system failed to initialize. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const content = (
    <PerformanceContext.Provider value={performanceSystem}>
      {children}
      {enableErrorUI && performanceSystem && (
        <ErrorToast errorManager={performanceSystem.errorManager} />
      )}
      {enableOfflineDetection && <OfflineIndicator />}
    </PerformanceContext.Provider>
  );

  // Wrap with error boundary if performance system is available
  if (enableErrorUI && performanceSystem) {
    return (
      <ErrorBoundary
        errorManager={performanceSystem.errorManager}
        showToast={false} // We're already showing toast above
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Hook to use the performance system
export function usePerformanceSystem(): PerformanceSystem {
  const context = useContext(PerformanceContext);

  if (!context) {
    throw new Error('usePerformanceSystem must be used within a PerformanceProvider');
  }

  return context;
}

// Hook for enhanced calendar API
export function useEnhancedCalendarApi() {
  const performanceSystem = usePerformanceSystem();

  return React.useMemo(() => {
    if (!performanceSystem) return null;

    return {
      getEvents: (params?: any) => performanceSystem.getCalendarEvents(
        params?.start_date ? new Date(params.start_date) : new Date(),
        params?.end_date ? new Date(params.end_date) : new Date()
      ),
      invalidateCache: (dateRange?: { start: Date; end: Date }) =>
        performanceSystem.invalidateCalendarCache(dateRange),
      getStats: () => performanceSystem.calendarCacheManager.getStats()
    };
  }, [performanceSystem]);
}

// Hook for API calls with performance enhancements
export function useEnhancedApi() {
  const performanceSystem = usePerformanceSystem();

  return React.useMemo(() => {
    if (!performanceSystem) {
      return {
        get: () => Promise.reject(new Error('Performance system not available')),
        post: () => Promise.reject(new Error('Performance system not available')),
        put: () => Promise.reject(new Error('Performance system not available')),
        delete: () => Promise.reject(new Error('Performance system not available'))
      };
    }

    return {
      get: performanceSystem.get.bind(performanceSystem),
      post: performanceSystem.post.bind(performanceSystem),
      put: performanceSystem.put.bind(performanceSystem),
      delete: performanceSystem.delete.bind(performanceSystem)
    };
  }, [performanceSystem]);
}

// Hook for error handling
export function useErrorHandler() {
  const performanceSystem = usePerformanceSystem();

  return React.useCallback((error: Error, context?: Record<string, any>) => {
    if (!performanceSystem) {
      throw error;
    }

    return performanceSystem.handleError(error, context);
  }, [performanceSystem]);
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const performanceSystem = usePerformanceSystem();

  return React.useMemo(() => {
    if (!performanceSystem) return null;

    return {
      recordMetric: performanceSystem.performanceMonitor.recordMetric.bind(performanceSystem.performanceMonitor),
      measureOperation: performanceSystem.performanceMonitor.measureOperation.bind(performanceSystem.performanceMonitor),
      getStats: performanceSystem.performanceMonitor.getStats.bind(performanceSystem.performanceMonitor)
    };
  }, [performanceSystem]);
}

// HOC for wrapping components with performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const monitoring = usePerformanceMonitoring();

    useEffect(() => {
      const startTime = performance.now();

      return () => {
        if (monitoring) {
          const duration = performance.now() - startTime;
          monitoring.recordMetric('component_render_time', duration, 'ms', {
            component: componentName
          });
        }
      };
    }, [monitoring]);

    return <Component {...props} />;
  };
}