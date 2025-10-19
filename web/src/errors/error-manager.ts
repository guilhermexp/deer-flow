// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Error Manager Implementation

import type {
  ApiError,
  ErrorCategory,
  ErrorHandlingStrategy,
  RecoveryAction
} from '../performance/types';
import { SimpleEventEmitter, classifyError } from '../utils/performance-utils';
import { PerformanceMonitor } from '../performance/performance-monitor';

export interface ErrorManagerConfig {
  performanceMonitor: PerformanceMonitor;
  enableErrorTracking: boolean;
  enableRecoveryActions: boolean;
  maxErrorHistory: number;
  errorDisplayDuration: number;
}

export interface UserFriendlyError {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recoveryActions: Array<{
    action: RecoveryAction;
    label: string;
    handler: () => void;
  }>;
  timestamp: Date;
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
}

export class ErrorManager extends SimpleEventEmitter {
  private config: ErrorManagerConfig;
  private errorHistory: Map<string, ApiError> = new Map();
  private activeErrors: Map<string, UserFriendlyError> = new Map();
  private errorStrategies: Map<ErrorCategory, ErrorHandlingStrategy> = new Map();

  constructor(config: Partial<ErrorManagerConfig> & { performanceMonitor: PerformanceMonitor }) {
    super();

    this.config = {
      enableErrorTracking: true,
      enableRecoveryActions: true,
      maxErrorHistory: 100,
      errorDisplayDuration: 5000, // 5 seconds
      ...config
    };

    this.initializeErrorStrategies();
  }

  // ==================== Public Methods ====================

  handleError(error: Error | ApiError, context?: Record<string, any>): UserFriendlyError {
    const apiError = this.convertToApiError(error, context);
    const strategy = this.getErrorStrategy(apiError);
    const userError = this.createUserFriendlyError(apiError, strategy);

    // Track the error
    if (this.config.enableErrorTracking) {
      this.trackError(apiError);
    }

    // Store in active errors
    this.activeErrors.set(userError.id, userError);

    // Emit error event
    this.emit('error:handled', { apiError, userError, strategy });

    // Auto-hide if configured
    if (userError.autoHide && userError.duration) {
      setTimeout(() => {
        this.dismissError(userError.id);
      }, userError.duration);
    }

    return userError;
  }

  classifyError(error: Error | ApiError): ErrorCategory {
    return classifyError(error);
  }

  generateUserMessage(error: ApiError): string {
    const strategy = this.getErrorStrategy(error);
    return strategy.userMessage;
  }

  suggestRecoveryActions(error: ApiError): RecoveryAction[] {
    const strategy = this.getErrorStrategy(error);
    return strategy.recoveryActions;
  }

  dismissError(errorId: string): boolean {
    const error = this.activeErrors.get(errorId);
    if (error) {
      this.activeErrors.delete(errorId);
      this.emit('error:dismissed', { errorId, error });
      return true;
    }
    return false;
  }

  clearAllErrors(): void {
    const errorIds = Array.from(this.activeErrors.keys());
    this.activeErrors.clear();
    this.emit('error:all_cleared', { errorIds });
  }

  getActiveErrors(): UserFriendlyError[] {
    return Array.from(this.activeErrors.values());
  }

  getErrorHistory(): ApiError[] {
    return Array.from(this.errorHistory.values());
  }

  // ==================== Error Strategy Management ====================

  setErrorStrategy(category: ErrorCategory, strategy: ErrorHandlingStrategy): void {
    this.errorStrategies.set(category, strategy);
  }

  private getErrorStrategy(error: ApiError): ErrorHandlingStrategy {
    const category = classifyError(error);
    return this.errorStrategies.get(category) || this.getDefaultStrategy(category);
  }

  private initializeErrorStrategies(): void {
    // Network errors
    this.errorStrategies.set('network', {
      category: 'network',
      retryable: true,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      technicalMessage: 'Network request failed',
      recoveryActions: ['retry', 'use_cache', 'show_offline'],
      maxRetries: 3
    });

    // Authentication errors
    this.errorStrategies.set('authentication', {
      category: 'authentication',
      retryable: true,
      userMessage: 'Your session has expired. Please sign in again.',
      technicalMessage: 'Authentication failed',
      recoveryActions: ['refresh_auth', 'redirect_login'],
      maxRetries: 2
    });

    // Service unavailable errors
    this.errorStrategies.set('service_unavailable', {
      category: 'service_unavailable',
      retryable: true,
      userMessage: 'The service is temporarily unavailable. Please try again in a few moments.',
      technicalMessage: 'Service unavailable',
      recoveryActions: ['retry', 'wait_and_retry', 'use_cache'],
      maxRetries: 3
    });

    // Rate limit errors
    this.errorStrategies.set('rate_limit', {
      category: 'rate_limit',
      retryable: true,
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      technicalMessage: 'Rate limit exceeded',
      recoveryActions: ['wait_and_retry'],
      maxRetries: 2
    });

    // Timeout errors
    this.errorStrategies.set('timeout', {
      category: 'timeout',
      retryable: true,
      userMessage: 'The request timed out. Please try again.',
      technicalMessage: 'Request timeout',
      recoveryActions: ['retry'],
      maxRetries: 2
    });

    // Validation errors
    this.errorStrategies.set('validation', {
      category: 'validation',
      retryable: false,
      userMessage: 'Please check your input and try again.',
      technicalMessage: 'Validation failed',
      recoveryActions: ['contact_support'],
      maxRetries: 0
    });

    // Unknown errors
    this.errorStrategies.set('unknown', {
      category: 'unknown',
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      technicalMessage: 'Unknown error',
      recoveryActions: ['retry', 'contact_support'],
      maxRetries: 1
    });
  }

  private getDefaultStrategy(category: ErrorCategory): ErrorHandlingStrategy {
    return {
      category,
      retryable: false,
      userMessage: 'An error occurred. Please try again.',
      technicalMessage: 'Unhandled error',
      recoveryActions: ['retry'],
      maxRetries: 1
    };
  }

  // ==================== Error Conversion and Creation ====================

  private convertToApiError(error: Error | ApiError, context?: Record<string, any>): ApiError {
    if (this.isApiError(error)) {
      return error;
    }

    return {
      code: 'GENERIC_ERROR',
      message: error.message || 'Unknown error occurred',
      statusCode: 0,
      endpoint: context?.endpoint || 'unknown',
      timestamp: new Date(),
      retryable: false,
      context,
      originalError: error
    };
  }

  private isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'code' in error && 'statusCode' in error;
  }

  private createUserFriendlyError(apiError: ApiError, strategy: ErrorHandlingStrategy): UserFriendlyError {
    const severity = this.determineSeverity(apiError, strategy);
    const recoveryActions = this.createRecoveryActions(apiError, strategy);

    return {
      id: this.generateErrorId(),
      title: this.getErrorTitle(apiError, strategy),
      message: strategy.userMessage,
      severity,
      recoveryActions,
      timestamp: new Date(),
      dismissible: true,
      autoHide: severity === 'info' || severity === 'warning',
      duration: severity === 'info' ? this.config.errorDisplayDuration : undefined
    };
  }

  private determineSeverity(apiError: ApiError, strategy: ErrorHandlingStrategy): UserFriendlyError['severity'] {
    // Critical errors
    if (apiError.statusCode === 0 || apiError.statusCode >= 500) {
      return 'critical';
    }

    // Error level
    if (apiError.statusCode >= 400 || strategy.category === 'authentication') {
      return 'error';
    }

    // Warning level
    if (strategy.category === 'rate_limit' || strategy.category === 'timeout') {
      return 'warning';
    }

    return 'info';
  }

  private getErrorTitle(apiError: ApiError, strategy: ErrorHandlingStrategy): string {
    const titles: Record<ErrorCategory, string> = {
      network: 'Connection Problem',
      authentication: 'Authentication Required',
      service_unavailable: 'Service Unavailable',
      rate_limit: 'Too Many Requests',
      timeout: 'Request Timeout',
      validation: 'Invalid Input',
      unknown: 'Unexpected Error'
    };

    return titles[strategy.category] || 'Error';
  }

  private createRecoveryActions(
    apiError: ApiError,
    strategy: ErrorHandlingStrategy
  ): UserFriendlyError['recoveryActions'] {
    if (!this.config.enableRecoveryActions) {
      return [];
    }

    return strategy.recoveryActions.map(action => ({
      action,
      label: this.getActionLabel(action),
      handler: () => this.executeRecoveryAction(action, apiError)
    }));
  }

  private getActionLabel(action: RecoveryAction): string {
    const labels: Record<RecoveryAction, string> = {
      retry: 'Try Again',
      refresh_auth: 'Sign In Again',
      use_cache: 'Use Offline Data',
      show_offline: 'Work Offline',
      redirect_login: 'Go to Login',
      contact_support: 'Contact Support',
      wait_and_retry: 'Wait and Retry'
    };

    return labels[action] || 'Unknown Action';
  }

  private executeRecoveryAction(action: RecoveryAction, apiError: ApiError): void {
    this.emit('error:recovery_action', { action, apiError });

    switch (action) {
      case 'retry':
        this.emit('error:retry_requested', { apiError });
        break;
      case 'refresh_auth':
        this.emit('auth:refresh_requested', { apiError });
        break;
      case 'redirect_login':
        this.emit('auth:login_requested', { apiError });
        break;
      case 'use_cache':
        this.emit('cache:fallback_requested', { apiError });
        break;
      case 'show_offline':
        this.emit('offline:mode_requested', { apiError });
        break;
      case 'contact_support':
        this.emit('support:contact_requested', { apiError });
        break;
      case 'wait_and_retry':
        setTimeout(() => {
          this.emit('error:retry_requested', { apiError });
        }, 5000); // Wait 5 seconds before retry
        break;
    }
  }

  // ==================== Error Tracking ====================

  private trackError(error: ApiError): void {
    // Add to history
    this.errorHistory.set(error.code + error.timestamp.getTime(), error);

    // Trim history if too large
    if (this.errorHistory.size > this.config.maxErrorHistory) {
      const oldestKey = this.errorHistory.keys().next().value;
      this.errorHistory.delete(oldestKey);
    }

    // Track with performance monitor
    this.config.performanceMonitor.recordMetric(
      'error_count',
      1,
      'count',
      {
        category: classifyError(error),
        code: error.code,
        endpoint: error.endpoint,
        status_code: error.statusCode.toString()
      }
    );
  }

  // ==================== Utility Methods ====================

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    this.errorHistory.clear();
    this.activeErrors.clear();
    this.errorStrategies.clear();
    this.removeAllListeners();
  }
}