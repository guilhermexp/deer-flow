// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Circuit Breaker Pattern Implementation

import {
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  ApiError
} from '../../performance/types';
import { CIRCUIT_BREAKER_DEFAULTS } from '../../performance/constants';
import { SimpleEventEmitter, classifyError } from '../../utils/performance-utils';

export class CircuitBreaker extends SimpleEventEmitter {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private totalRequests: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    super();

    this.config = {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.FAILURE_THRESHOLD,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.RESET_TIMEOUT,
      monitoringPeriod: CIRCUIT_BREAKER_DEFAULTS.MONITORING_PERIOD,
      healthCheckInterval: CIRCUIT_BREAKER_DEFAULTS.HEALTH_CHECK_INTERVAL,
      ...config
    };

    this.startHealthCheck();
  }

  // ==================== Public Methods ====================

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check circuit state before executing
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.canAttemptReset()) {
        this.moveToHalfOpen();
      } else {
        throw this.createCircuitOpenError();
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as ApiError);
      throw error;
    }
  }

  canExecute(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return true;
    }

    if (this.state === CircuitBreakerState.OPEN) {
      return this.canAttemptReset();
    }

    return false;
  }

  forceOpen(): void {
    this.moveToOpen();
    this.emit('circuit_breaker:forced_open', this.getStats());
  }

  forceClose(): void {
    this.moveToClosed();
    this.emit('circuit_breaker:forced_close', this.getStats());
  }

  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.moveToClosed();
    this.emit('circuit_breaker:reset', this.getStats());
  }

  getStats(): CircuitBreakerStats {
    const failureRate = this.totalRequests > 0
      ? (this.failureCount / this.totalRequests) * 100
      : 0;

    return {
      service: this.config.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      failureRate
    };
  }

  // ==================== Private Methods ====================

  private onSuccess(): void {
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Success in half-open state means we can close the circuit
      this.moveToClosed();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
      this.lastFailureTime = null;
    }

    this.emit('circuit_breaker:success', this.getStats());
  }

  private onFailure(error: ApiError): void {
    // Only count certain types of errors as circuit breaker failures
    if (!this.isCircuitBreakerError(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.moveToOpen();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.moveToOpen();
      }
    }

    this.emit('circuit_breaker:failure', { error, stats: this.getStats() });
  }

  private isCircuitBreakerError(error: ApiError): boolean {
    // Only certain types of errors should trigger circuit breaker
    const category = classifyError(error);

    // Network, timeout, and service unavailable errors should trigger circuit breaker
    const triggerCategories = ['network', 'timeout', 'service_unavailable'];
    if (triggerCategories.includes(category)) {
      return true;
    }

    // Specific HTTP status codes that indicate service issues
    if (error.statusCode) {
      const triggerStatusCodes = [500, 502, 503, 504];
      return triggerStatusCodes.includes(error.statusCode);
    }
    // Unknown errors (no status code) should still be counted as failures
    return true;
  }

  private shouldOpenCircuit(): boolean {
    return this.failureCount >= this.config.failureThreshold;
  }

  private canAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }

    return new Date() >= this.nextAttemptTime;
  }

  private moveToClosed(): void {
    const previousState = this.state;
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.nextAttemptTime = null;

    if (previousState !== CircuitBreakerState.CLOSED) {
      this.emit('circuit_breaker:state_change', {
        from: previousState,
        to: this.state,
        stats: this.getStats()
      });
    }
  }

  private moveToOpen(): void {
    const previousState = this.state;
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);

    if (previousState !== CircuitBreakerState.OPEN) {
      this.emit('circuit_breaker:state_change', {
        from: previousState,
        to: this.state,
        stats: this.getStats()
      });
    }
  }

  private moveToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitBreakerState.HALF_OPEN;
    this.nextAttemptTime = null;

    if (previousState !== CircuitBreakerState.HALF_OPEN) {
      this.emit('circuit_breaker:state_change', {
        from: previousState,
        to: this.state,
        stats: this.getStats()
      });
    }
  }

  private createCircuitOpenError(): ApiError {
    return {
      code: 'CIRCUIT_BREAKER_OPEN',
      message: `Circuit breaker is open for service: ${this.config.name}`,
      statusCode: 503,
      endpoint: this.config.name,
      timestamp: new Date(),
      retryable: true,
      context: {
        nextAttemptTime: this.nextAttemptTime,
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      }
    };
  }

  private startHealthCheck(): void {
    if (!this.config.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    // This is a basic health check that can be extended
    // For now, it just emits current stats
    this.emit('circuit_breaker:health_check', this.getStats());

    // Reset old failure counts periodically
    if (this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
      if (timeSinceLastFailure > this.config.monitoringPeriod) {
        // Reset failure count if no recent failures
        this.failureCount = Math.max(0, this.failureCount - 1);
      }
    }
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.removeAllListeners();
  }
}

// Circuit Breaker Manager for handling multiple services
export class CircuitBreakerManager extends SimpleEventEmitter {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  getOrCreateCircuitBreaker(
    serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker({
        name: serviceName,
        ...config
      });

      // Forward events
      circuitBreaker.on('circuit_breaker:state_change', (data) => {
        this.emit('circuit_breaker:state_change', data);
      });

      circuitBreaker.on('circuit_breaker:failure', (data) => {
        this.emit('circuit_breaker:failure', data);
      });

      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName, config);
    return circuitBreaker.execute(operation);
  }

  getCircuitBreaker(serviceName: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(serviceName);
  }

  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.circuitBreakers.values()).map(cb => cb.getStats());
  }

  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }

  destroy(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.destroy();
    }
    this.circuitBreakers.clear();
    this.removeAllListeners();
  }
}

// Default instance
export const circuitBreakerManager = new CircuitBreakerManager();
