# Performance & Reliability System

A comprehensive performance optimization and reliability enhancement system for the DeerFlow application. This system addresses critical performance issues including excessive API calls, resource preloading problems, backend service failures, and authentication issues.

## Features

### 🚀 Core Performance Components

- **CacheService**: Redis/localStorage fallback with TTL support and automatic cleanup
- **PerformanceMonitor**: API call tracking, metrics collection, and Performance Observer integration
- **CalendarCacheManager**: Date range caching with 300ms debouncing and batch processing
- **ResourcePreloadOptimizer**: Preload validation, dynamic management, and cleanup

### 🛡️ API Resilience

- **CircuitBreaker**: State management with failure thresholds and automatic recovery
- **ResilientApiClient**: Exponential backoff retry logic with error classification
- **AuthManager**: Token lifecycle management with automatic refresh

### 🚨 Error Handling

- **ErrorManager**: Error classification with user-friendly messages and recovery actions
- **ErrorBoundary**: React error boundaries with retry functionality
- **Error UI Components**: Toast notifications and offline indicators

## Quick Start

### 1. Basic Setup

```tsx
import { PerformanceProvider } from '@/performance';

function App() {
  return (
    <PerformanceProvider
      config={{
        baseURL: 'http://localhost:8005/api',
        refreshTokenUrl: '/auth/refresh',
        loginUrl: '/login'
      }}
      enableErrorUI={true}
      enableOfflineDetection={true}
    >
      <YourAppComponents />
    </PerformanceProvider>
  );
}
```

### 2. Using Enhanced API Client

```tsx
import { useEnhancedApi, useErrorHandler } from '@/performance';

function MyComponent() {
  const api = useEnhancedApi();
  const handleError = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.get('/calendar/events');
      return data;
    } catch (error) {
      handleError(error, { component: 'MyComponent' });
    }
  };

  return <div>...</div>;
}
```

### 3. Enhanced Calendar Integration

```tsx
import { useEnhancedCalendarApi } from '@/performance';

function CalendarComponent() {
  const { getEvents, invalidateCache } = useEnhancedCalendarApi();

  const loadEvents = async () => {
    const events = await getEvents({
      start_date: '2025-01-01',
      end_date: '2025-01-31'
    });
    return events;
  };

  return <div>...</div>;
}
```

## Architecture

### System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│ PerformanceSystem│───▶│   Backend API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Cache Layer    │
                       │ - Memory Cache   │
                       │ - localStorage   │
                       └──────────────────┘
```

### Component Interaction

```
PerformanceSystem
├── CacheService (memory + localStorage)
├── PerformanceMonitor (metrics + alerts)
├── ResilientApiClient
│   ├── CircuitBreaker (failure protection)
│   ├── RetryManager (exponential backoff)
│   └── AuthManager (token lifecycle)
├── CalendarCacheManager (debounced loading)
├── ResourcePreloadOptimizer (preload management)
└── ErrorManager (classification + recovery)
```

## Configuration

### Default Configuration

```typescript
const config = {
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 * 1024 * 1024, // 100MB
    enableRedis: false // Browser environment
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
    enablePerformanceObserver: true,
    enableApiTracking: true,
    alertThresholds: [
      {
        metric: 'api_response_time',
        warningValue: 1000, // 1 second
        criticalValue: 3000, // 3 seconds
        unit: 'ms'
      }
    ]
  }
};
```

### Custom Configuration

```typescript
import { createPerformanceSystem } from '@/performance';

const system = createPerformanceSystem({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  refreshTokenUrl: '/auth/refresh',
  loginUrl: '/login',
  cache: {
    defaultTtl: 10 * 60 * 1000, // 10 minutes
    maxSize: 200 * 1024 * 1024 // 200MB
  },
  retry: {
    defaultMaxRetries: 5,
    defaultBaseDelay: 2000
  }
});

await system.initialize();
```

## Advanced Usage

### Manual Circuit Breaker Control

```typescript
import { usePerformanceSystem } from '@/performance';

function AdminPanel() {
  const system = usePerformanceSystem();

  const openCircuitBreaker = (serviceName: string) => {
    const cb = system.circuitBreakerManager.getCircuitBreaker(serviceName);
    cb?.forceOpen();
  };

  const resetCircuitBreaker = (serviceName: string) => {
    const cb = system.circuitBreakerManager.getCircuitBreaker(serviceName);
    cb?.reset();
  };

  return <div>...</div>;
}
```

### Custom Error Handling

```typescript
import { ErrorManager, ErrorCategory } from '@/performance';

const errorManager = new ErrorManager({
  performanceMonitor: system.performanceMonitor
});

// Custom error strategy
errorManager.setErrorStrategy('custom_category', {
  category: 'custom_category',
  retryable: true,
  userMessage: 'Custom error occurred',
  technicalMessage: 'Technical details',
  recoveryActions: ['retry', 'contact_support'],
  maxRetries: 2
});
```

### Performance Monitoring

```typescript
import { usePerformanceMonitoring } from '@/performance';

function MonitoredComponent() {
  const monitoring = usePerformanceMonitoring();

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      monitoring?.recordMetric('component_lifecycle', duration, 'ms', {
        component: 'MonitoredComponent'
      });
    };
  }, [monitoring]);

  return <div>...</div>;
}
```

## Performance Targets

- **Calendar Load Time**: < 500ms (cached), < 2s (uncached)
- **API Response Time**: 95th percentile < 1s
- **Cache Hit Rate**: > 80% for calendar events
- **Error Rate**: < 1% for authenticated requests
- **Resource Load Efficiency**: < 5% unused preloads
- **Circuit Breaker Recovery**: < 30s to service restoration

## Testing

### Running Tests

```bash
# Backend tests
npm test

# Frontend tests
cd web && npm test

# Specific component tests
npm test -- cache-service.test.ts
npm test -- circuit-breaker.test.ts
npm test -- performance-monitor.test.ts
```

### Test Coverage

- Unit tests for all core components
- Integration tests for end-to-end scenarios
- Performance benchmarks before/after optimization
- Error recovery scenario testing

## Monitoring

### Performance Metrics

The system automatically tracks:

- API response times and success rates
- Cache hit/miss ratios
- Circuit breaker state changes
- Error rates and classifications
- Resource preload effectiveness

### Alerts

Automatic alerts are generated for:

- API response times > 1s (warning) / 3s (critical)
- Cache hit rate < 60% (warning) / 40% (critical)
- Error rate > 1% (warning) / 5% (critical)
- Circuit breaker openings

### Accessing Stats

```typescript
const system = usePerformanceSystem();
const stats = system.getSystemStats();

console.log('Cache stats:', stats.cache);
console.log('Performance stats:', stats.performance);
console.log('API stats:', stats.api);
console.log('Error stats:', stats.errors);
```

## Troubleshooting

### Common Issues

1. **High API Response Times**
   - Check circuit breaker states
   - Verify cache hit rates
   - Review network conditions

2. **Cache Misses**
   - Verify cache TTL settings
   - Check cache size limits
   - Review invalidation patterns

3. **Authentication Errors**
   - Check token expiration
   - Verify refresh token availability
   - Review auth service configuration

### Debug Mode

```typescript
// Enable debug logging
const system = createPerformanceSystem({
  ...config,
  enableDebugLogging: true
});
```

## Migration Guide

### From Existing Calendar API

```typescript
// Before
import { calendarApi } from '@/core/api/calendar';
const events = await calendarApi.getEvents({ start_date, end_date });

// After
import { useEnhancedCalendarApi } from '@/performance';
const { getEvents } = useEnhancedCalendarApi();
const events = await getEvents({ start_date, end_date });
```

### From Direct API Calls

```typescript
// Before
import { apiClient } from '@/core/api/client';
const data = await apiClient.get('/endpoint');

// After
import { useEnhancedApi } from '@/performance';
const api = useEnhancedApi();
const data = await api.get('/endpoint');
```

## Contributing

1. Add new performance components in `/src/performance/`
2. Write comprehensive unit tests
3. Update type definitions in `/src/performance/types.ts`
4. Add integration examples
5. Update documentation

## License

Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
SPDX-License-Identifier: MIT