// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorManager } from '../error-manager';
import { ErrorToast } from './error-toast';
import { ErrorDialog } from './error-dialog';
import type { UserFriendlyError } from '../error-manager';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: UserFriendlyError) => ReactNode;
  errorManager?: ErrorManager;
  showToast?: boolean;
  showDialog?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  userError: UserFriendlyError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorManager: ErrorManager;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      userError: null
    };

    // Use provided ErrorManager or create a default one
    this.errorManager = props.errorManager || new ErrorManager({
      performanceMonitor: { recordMetric: () => {} } as any
    });
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle the error with ErrorManager
    const userError = this.errorManager.handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    this.setState({
      userError
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      userError: null
    });
  };

  render() {
    if (this.state.hasError && this.state.userError) {
      const { userError } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(userError);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {userError.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {userError.message}
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {userError.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.handler();
                    if (action.action === 'retry') {
                      this.handleRetry();
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {action.label}
                </button>
              ))}

              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-xs text-gray-500">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                  {JSON.stringify(userError, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        {this.props.children}
        {this.props.showToast && <ErrorToast errorManager={this.errorManager} />}
        {this.props.showDialog && <ErrorDialog errorManager={this.errorManager} />}
      </>
    );
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for using ErrorBoundary context
export function useErrorHandler(errorManager?: ErrorManager) {
  const handleError = React.useCallback((error: Error, context?: Record<string, any>) => {
    if (errorManager) {
      return errorManager.handleError(error, context);
    }

    // Fallback: throw error to be caught by nearest error boundary
    throw error;
  }, [errorManager]);

  return { handleError };
}