// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Circuit Breaker Unit Tests

import { CircuitBreaker, CircuitBreakerManager } from '../../api/resilient/circuit-breaker';
import { CircuitBreakerState } from '../types';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      name: 'test-service',
      failureThreshold: 3,
      resetTimeout: 1000, // 1 second for testing
      monitoringPeriod: 5000
    });
  });

  afterEach(() => {
    circuitBreaker.destroy();
  });

  describe('Closed State', () => {
    it('should start in closed state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(0);
    });

    it('should allow requests when closed', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should execute operations successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);

      const stats = circuitBreaker.getStats();
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(0);
    });

    it('should track failures but remain closed below threshold', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Fail twice (below threshold of 3)
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service error');
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service error');

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(2);
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Open State', () => {
    beforeEach(async () => {
      // Trigger circuit breaker to open by exceeding failure threshold
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Internal Server Error'
      });

      // Fail 3 times to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected failures
        }
      }
    });

    it('should open after reaching failure threshold', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
      expect(stats.failureCount).toBe(3);
    });

    it('should reject requests immediately when open', async () => {
      const mockOperation = jest.fn();

      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('Circuit breaker is open');

      // Operation should not be called
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should not allow execution when open', () => {
      expect(circuitBreaker.canExecute()).toBe(false);
    });
  });

  describe('Half-Open State', () => {
    beforeEach(async () => {
      // Open the circuit
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Internal Server Error'
      });

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected failures
        }
      }

      // Wait for reset timeout to allow transition to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('should transition to half-open after reset timeout', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should close circuit on successful operation in half-open state', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockOperation);

      expect(result).toBe('success');

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(0); // Should reset on close
    });

    it('should reopen circuit on failure in half-open state', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Still failing'
      });

      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('Still failing');

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('Error Classification', () => {
    it('should only trigger on circuit breaker errors (5xx, timeout, network)', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 400,
        message: 'Bad Request'
      });

      // 400 errors should not trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected failures
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(0); // Should not count 4xx errors
    });

    it('should trigger on 5xx errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 503,
        message: 'Service Unavailable'
      });

      // Should trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected failures
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
      expect(stats.failureCount).toBe(3);
    });
  });

  describe('Manual Control', () => {
    it('should allow manual force open', () => {
      circuitBreaker.forceOpen();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
    });

    it('should allow manual force close', async () => {
      // First open the circuit
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Error'
      });

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

      // Force close
      circuitBreaker.forceClose();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(0);
    });

    it('should allow manual reset', async () => {
      // Open the circuit
      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Error'
      });

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

      // Reset
      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
    });
  });

  describe('Events', () => {
    it('should emit state change events', async () => {
      const stateChangeSpy = jest.fn();
      circuitBreaker.on('circuit_breaker:state_change', stateChangeSpy);

      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Error'
      });

      // Trigger state change to OPEN
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(stateChangeSpy).toHaveBeenCalledWith({
        from: CircuitBreakerState.CLOSED,
        to: CircuitBreakerState.OPEN,
        stats: expect.any(Object)
      });
    });

    it('should emit failure events', async () => {
      const failureSpy = jest.fn();
      circuitBreaker.on('circuit_breaker:failure', failureSpy);

      const mockOperation = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Error'
      });

      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }

      expect(failureSpy).toHaveBeenCalledWith({
        error: expect.any(Object),
        stats: expect.any(Object)
      });
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should create and manage multiple circuit breakers', () => {
    const cb1 = manager.getOrCreateCircuitBreaker('service1');
    const cb2 = manager.getOrCreateCircuitBreaker('service2');
    const cb1Again = manager.getOrCreateCircuitBreaker('service1');

    expect(cb1).toBeDefined();
    expect(cb2).toBeDefined();
    expect(cb1).toBe(cb1Again); // Should return same instance
    expect(cb1).not.toBe(cb2); // Should be different instances
  });

  it('should execute operations with circuit breaker', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');

    const result = await manager.executeWithCircuitBreaker(
      'test-service',
      mockOperation
    );

    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should return stats for all circuit breakers', async () => {
    // Create multiple circuit breakers with some activity
    await manager.executeWithCircuitBreaker('service1', () => Promise.resolve('ok'));
    await manager.executeWithCircuitBreaker('service2', () => Promise.resolve('ok'));

    const allStats = manager.getAllStats();

    expect(allStats).toHaveLength(2);
    expect(allStats[0].service).toBe('service1');
    expect(allStats[1].service).toBe('service2');
  });

  it('should reset all circuit breakers', async () => {
    // Create circuit breakers and trigger some failures
    const failureOp = () => Promise.reject({ statusCode: 500, message: 'Error' });

    try {
      await manager.executeWithCircuitBreaker('service1', failureOp);
    } catch (error) {
      // Expected
    }

    // Verify there are failures
    const statsBefore = manager.getAllStats();
    expect(statsBefore[0].failureCount).toBeGreaterThan(0);

    // Reset all
    manager.resetAll();

    // Verify reset
    const statsAfter = manager.getAllStats();
    expect(statsAfter[0].failureCount).toBe(0);
    expect(statsAfter[0].state).toBe(CircuitBreakerState.CLOSED);
  });
});
