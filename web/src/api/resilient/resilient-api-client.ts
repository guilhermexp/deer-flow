// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Resilient API Client Implementation with Circuit Breaker and Retry Logic

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type {
  ResilientApiClient as IResilientApiClient,
  RetryOptions,
  RetryStats,
  ApiError,
  ErrorHandlingStrategy,
  CircuitBreakerStats
} from '../../performance/types';
import { CircuitBreakerManager } from './circuit-breaker';
import { PerformanceMonitor } from '../../performance/performance-monitor';
import { RETRY_DEFAULTS, RETRYABLE_STATUS_CODES } from '../../performance/constants';
import {
  calculateRetryDelay,
  isRetryableError,
  classifyError,
  measurePerformance,
  timeout
} from '../../utils/performance-utils';

export interface ResilientApiClientConfig {
  baseURL: string;
  timeout: number;
  circuitBreakerManager: CircuitBreakerManager;
  performanceMonitor: PerformanceMonitor;
  defaultRetryOptions: RetryOptions;
  enableCircuitBreaker: boolean;
  enableRetry: boolean;
  enablePerformanceTracking: boolean;
}

export class ResilientApiClient implements IResilientApiClient {
  private axiosInstance: AxiosInstance;
  private config: ResilientApiClientConfig;
  private retryStats: Map<string, RetryStats> = new Map();

  constructor(config: Partial<ResilientApiClientConfig> & { baseURL: string }) {
    this.config = {
      timeout: 10000, // 10 seconds
      enableCircuitBreaker: true,
      enableRetry: true,
      enablePerformanceTracking: true,
      defaultRetryOptions: {
        maxRetries: RETRY_DEFAULTS.MAX_RETRIES,
        baseDelay: RETRY_DEFAULTS.BASE_DELAY,
        maxDelay: RETRY_DEFAULTS.MAX_DELAY,
        backoffMultiplier: RETRY_DEFAULTS.BACKOFF_MULTIPLIER,
        retryableErrors: [...RETRYABLE_STATUS_CODES]
      },
      circuitBreakerManager: new CircuitBreakerManager(),
      performanceMonitor: new PerformanceMonitor(),
      ...config
    };

    this.createAxiosInstance();
    this.setupInterceptors();
  }

  // ==================== Public Methods ====================

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    if (!this.config.enableCircuitBreaker) {
      return operation();
    }

    return this.config.circuitBreakerManager.executeWithCircuitBreaker(
      serviceName,
      operation
    );
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = this.config.defaultRetryOptions
  ): Promise<T> {
    if (!this.config.enableRetry) {
      return operation();
    }

    const mergedOptions = { ...this.config.defaultRetryOptions, ...options };
    let lastError: ApiError;
    let attempt = 0;

    while (attempt <= mergedOptions.maxRetries) {
      try {
        const result = await operation();

        // Record successful retry if this wasn't the first attempt
        if (attempt > 0) {
          this.recordRetrySuccess(attempt);
        }

        return result;
      } catch (error) {
        const apiError = this.convertToApiError(error);
        lastError = apiError;
        attempt++;

        // Check if we should retry
        if (attempt > mergedOptions.maxRetries) {
          this.recordRetryFailure(attempt - 1);
          break;
        }

        // Check if error is retryable
        const shouldRetry = mergedOptions.retryCondition
          ? mergedOptions.retryCondition(apiError)
          : this.shouldRetryError(apiError, mergedOptions);

        if (!shouldRetry) {
          this.recordRetryFailure(attempt - 1);
          break;
        }

        // Calculate delay and wait
        const delay = calculateRetryDelay(
          attempt - 1,
          mergedOptions.baseDelay,
          mergedOptions.backoffMultiplier,
          mergedOptions.maxDelay
        );

        // Call retry callback if provided
        if (mergedOptions.onRetry) {
          mergedOptions.onRetry(attempt, apiError);
        }

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  handleApiError(error: ApiError): ErrorHandlingStrategy {
    const category = classifyError(error);

    const strategies: Record<string, ErrorHandlingStrategy> = {
      network: {
        category,
        retryable: true,
        userMessage: 'Network connection issue. Please check your internet connection.',
        technicalMessage: error.message,
        recoveryActions: ['retry', 'use_cache'],
        maxRetries: 3
      },
      authentication: {
        category,
        retryable: true,
        userMessage: 'Authentication expired. Please sign in again.',
        technicalMessage: error.message,
        recoveryActions: ['refresh_auth', 'redirect_login'],
        maxRetries: 2
      },
      service_unavailable: {
        category,
        retryable: true,
        userMessage: 'Service temporarily unavailable. Please try again later.',
        technicalMessage: error.message,
        recoveryActions: ['retry', 'wait_and_retry', 'use_cache'],
        maxRetries: 3
      },
      rate_limit: {
        category,
        retryable: true,
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        technicalMessage: error.message,
        recoveryActions: ['wait_and_retry'],
        maxRetries: 2
      },
      timeout: {
        category,
        retryable: true,
        userMessage: 'Request timed out. Please try again.',
        technicalMessage: error.message,
        recoveryActions: ['retry'],
        maxRetries: 2
      },
      validation: {
        category,
        retryable: false,
        userMessage: 'Invalid request. Please check your input.',
        technicalMessage: error.message,
        recoveryActions: ['contact_support'],
        maxRetries: 0
      },
      unknown: {
        category,
        retryable: false,
        userMessage: 'An unexpected error occurred. Please try again.',
        technicalMessage: error.message,
        recoveryActions: ['retry', 'contact_support'],
        maxRetries: 1
      }
    };

    return strategies[category] || strategies.unknown;
  }

  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    if (!this.config.enablePerformanceTracking) {
      return;
    }

    this.config.performanceMonitor.recordApiCall(
      endpoint,
      'GET', // Will be overridden by actual method in interceptors
      success ? 200 : 500,
      duration,
      { cached: false }
    );
  }

  getStats(): { circuitBreakers: CircuitBreakerStats[]; retryStats: RetryStats } {
    const circuitBreakers = this.config.circuitBreakerManager.getAllStats();

    // Aggregate retry stats
    let totalAttempts = 0;
    let successfulRetries = 0;
    let failedRetries = 0;
    let totalRetryDelay = 0;
    let maxRetryDelay = 0;

    for (const stats of this.retryStats.values()) {
      totalAttempts += stats.totalAttempts;
      successfulRetries += stats.successfulRetries;
      failedRetries += stats.failedRetries;
      totalRetryDelay += stats.averageRetryDelay * stats.totalAttempts;
      maxRetryDelay = Math.max(maxRetryDelay, stats.maxRetryDelay);
    }

    const retryStats: RetryStats = {
      totalAttempts,
      successfulRetries,
      failedRetries,
      averageRetryDelay: totalAttempts > 0 ? totalRetryDelay / totalAttempts : 0,
      maxRetryDelay
    };

    return { circuitBreakers, retryStats };
  }

  // ==================== HTTP Methods ====================

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  // ==================== Private Methods ====================

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const serviceName = this.getServiceName(config.url || '');

    // Wrap the request with circuit breaker and retry logic
    const operation = () => this.executeRequest<T>(config);

    // First apply circuit breaker
    const circuitBreakerOperation = () =>
      this.executeWithCircuitBreaker(operation, serviceName);

    // Then apply retry logic
    const result = await this.executeWithRetry(circuitBreakerOperation);

    return result;
  }

  private async executeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  private createAxiosInstance(): void {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add request start time for performance tracking
        (config as any).__startTime = performance.now();
        return config;
      },
      (error) => Promise.reject(this.convertToApiError(error))
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Track successful request
        this.trackRequestPerformance(response, true);
        return response;
      },
      (error) => {
        // Track failed request
        this.trackRequestPerformance(error, false);
        return Promise.reject(this.convertToApiError(error));
      }
    );
  }

  private trackRequestPerformance(responseOrError: AxiosResponse | AxiosError, success: boolean): void {
    if (!this.config.enablePerformanceTracking) {
      return;
    }

    let config: AxiosRequestConfig;
    let duration: number;

    if (success) {
      const response = responseOrError as AxiosResponse;
      config = response.config;
      duration = performance.now() - ((config as any).__startTime || 0);
    } else {
      const error = responseOrError as AxiosError;
      config = error.config || {};
      duration = performance.now() - ((config as any).__startTime || 0);
    }

    const endpoint = config.url || 'unknown';
    const method = (config.method || 'GET').toUpperCase();

    this.config.performanceMonitor.recordApiCall(
      endpoint,
      method,
      success ? 200 : (responseOrError as AxiosError).response?.status || 0,
      duration,
      {
        requestSize: this.calculateRequestSize(config),
        responseSize: success
          ? this.calculateResponseSize(responseOrError as AxiosResponse)
          : 0,
        cached: false
      }
    );
  }

  private calculateRequestSize(config: AxiosRequestConfig): number {
    if (!config.data) return 0;

    try {
      return new Blob([JSON.stringify(config.data)]).size;
    } catch {
      return 0;
    }
  }

  private calculateResponseSize(response: AxiosResponse): number {
    try {
      return new Blob([JSON.stringify(response.data)]).size;
    } catch {
      return 0;
    }
  }

  private convertToApiError(error: any): ApiError {
    if (error.isApiError) {
      return error;
    }

    let apiError: ApiError;

    if (axios.isAxiosError(error)) {
      apiError = {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        statusCode: error.response?.status || 0,
        endpoint: error.config?.url || 'unknown',
        timestamp: new Date(),
        retryable: isRetryableError(error as any),
        originalError: error,
        context: {
          url: error.config?.url,
          method: error.config?.method,
          responseData: error.response?.data
        }
      };
    } else {
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        statusCode: 0,
        endpoint: 'unknown',
        timestamp: new Date(),
        retryable: false,
        originalError: error
      };
    }

    // Mark as ApiError to avoid double conversion
    (apiError as any).isApiError = true;

    return apiError;
  }

  private shouldRetryError(error: ApiError, options: RetryOptions): boolean {
    // Check if error is in the retryable list
    if (options.retryableErrors.includes(error.statusCode)) {
      return true;
    }

    // Use the utility function
    return isRetryableError(error);
  }

  private getServiceName(url: string): string {
    try {
      const urlObj = new URL(url, this.config.baseURL);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts[0] || 'api';
    } catch {
      return 'api';
    }
  }

  private recordRetrySuccess(attempt: number): void {
    const key = 'global';
    const stats = this.retryStats.get(key) || {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0,
      maxRetryDelay: 0
    };

    stats.totalAttempts += attempt;
    stats.successfulRetries++;
    this.retryStats.set(key, stats);
  }

  private recordRetryFailure(attempt: number): void {
    const key = 'global';
    const stats = this.retryStats.get(key) || {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0,
      maxRetryDelay: 0
    };

    stats.totalAttempts += attempt;
    stats.failedRetries++;
    this.retryStats.set(key, stats);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    this.config.circuitBreakerManager.destroy();
    this.retryStats.clear();
  }
}