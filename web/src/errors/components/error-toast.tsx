// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

'use client';

import React, { useState, useEffect } from 'react';
import { ErrorManager, UserFriendlyError } from '../error-manager';

interface ErrorToastProps {
  errorManager: ErrorManager;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export function ErrorToast({
  errorManager,
  position = 'top-right',
  maxVisible = 3
}: ErrorToastProps) {
  const [errors, setErrors] = useState<UserFriendlyError[]>([]);

  useEffect(() => {
    const handleError = (data: { userError: UserFriendlyError }) => {
      setErrors(prev => {
        const newErrors = [data.userError, ...prev];
        // Keep only the most recent errors
        return newErrors.slice(0, maxVisible);
      });
    };

    const handleDismissed = (data: { errorId: string }) => {
      setErrors(prev => prev.filter(error => error.id !== data.errorId));
    };

    const handleAllCleared = () => {
      setErrors([]);
    };

    errorManager.on('error:handled', handleError);
    errorManager.on('error:dismissed', handleDismissed);
    errorManager.on('error:all_cleared', handleAllCleared);

    return () => {
      errorManager.off('error:handled', handleError);
      errorManager.off('error:dismissed', handleDismissed);
      errorManager.off('error:all_cleared', handleAllCleared);
    };
  }, [errorManager, maxVisible]);

  const dismissError = (errorId: string) => {
    errorManager.dismissError(errorId);
  };

  const getPositionClasses = () => {
    const classes = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    };
    return classes[position];
  };

  const getSeverityClasses = (severity: UserFriendlyError['severity']) => {
    const classes = {
      info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
      error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
      critical: 'bg-red-100 border-red-300 text-red-900 dark:bg-red-800 dark:border-red-600 dark:text-red-100'
    };
    return classes[severity];
  };

  const getSeverityIcon = (severity: UserFriendlyError['severity']) => {
    switch (severity) {
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
      {errors.map((error, index) => (
        <div
          key={error.id}
          className={`
            p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out
            ${getSeverityClasses(error.severity)}
            ${index === 0 ? 'transform translate-x-0' : 'transform translate-x-full opacity-75'}
          `}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getSeverityIcon(error.severity)}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">
                {error.title}
              </h4>
              <p className="text-sm mt-1 opacity-90">
                {error.message}
              </p>

              {error.recoveryActions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {error.recoveryActions.slice(0, 2).map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={action.handler}
                      className="text-xs px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error.dismissible && (
              <button
                onClick={() => dismissError(error.id)}
                className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Progress indicator for errors with recovery actions
export function ErrorProgress({
  error,
  onComplete
}: {
  error: UserFriendlyError;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (error.autoHide && error.duration) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (error.duration! / 100));
          if (newProgress >= 100) {
            onComplete();
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [error, onComplete]);

  if (!error.autoHide || !error.duration) {
    return null;
  }

  return (
    <div className="w-full bg-white bg-opacity-20 rounded-full h-1 mt-2">
      <div
        className="bg-white h-1 rounded-full transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}