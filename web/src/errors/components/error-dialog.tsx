// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

'use client';

import React, { useState, useEffect } from 'react';
import { ErrorManager, UserFriendlyError } from '../error-manager';

interface ErrorDialogProps {
  errorManager: ErrorManager;
  showOnlyCritical?: boolean;
}

export function ErrorDialog({
  errorManager,
  showOnlyCritical = true
}: ErrorDialogProps) {
  const [currentError, setCurrentError] = useState<UserFriendlyError | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleError = (data: { userError: UserFriendlyError }) => {
      const { userError } = data;

      // Only show critical errors in dialog by default
      if (showOnlyCritical && userError.severity !== 'critical') {
        return;
      }

      setCurrentError(userError);
      setIsOpen(true);
    };

    const handleDismissed = (data: { errorId: string }) => {
      if (currentError && currentError.id === data.errorId) {
        setIsOpen(false);
        setCurrentError(null);
      }
    };

    errorManager.on('error:handled', handleError);
    errorManager.on('error:dismissed', handleDismissed);

    return () => {
      errorManager.off('error:handled', handleError);
      errorManager.off('error:dismissed', handleDismissed);
    };
  }, [errorManager, showOnlyCritical, currentError]);

  const closeDialog = () => {
    if (currentError) {
      errorManager.dismissError(currentError.id);
    }
    setIsOpen(false);
    setCurrentError(null);
  };

  if (!isOpen || !currentError) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeDialog}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <ErrorIcon severity={currentError.severity} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {currentError.title}
              </h3>
            </div>

            {currentError.dismissible && (
              <button
                onClick={closeDialog}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {currentError.message}
            </p>

            {/* Recovery Actions */}
            {currentError.recoveryActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  What would you like to do?
                </h4>

                {currentError.recoveryActions.map((action, index) => (
                  <ActionButton
                    key={index}
                    action={action}
                    isPrimary={index === 0}
                    onComplete={closeDialog}
                  />
                ))}
              </div>
            )}

            {/* Technical Details (Development only) */}
            {process.env.NODE_ENV === 'development' && (
              <TechnicalDetails error={currentError} />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {currentError.dismissible && (
              <button
                onClick={closeDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error icon component
function ErrorIcon({ severity }: { severity: UserFriendlyError['severity'] }) {
  const getIconProps = () => {
    switch (severity) {
      case 'info':
        return {
          className: 'w-6 h-6 text-blue-600 dark:text-blue-400',
          path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
      case 'warning':
        return {
          className: 'w-6 h-6 text-yellow-600 dark:text-yellow-400',
          path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
        };
      case 'error':
        return {
          className: 'w-6 h-6 text-red-600 dark:text-red-400',
          path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
      case 'critical':
        return {
          className: 'w-6 h-6 text-red-700 dark:text-red-300',
          path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
    }
  };

  const { className, path } = getIconProps();

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
    </svg>
  );
}

// Action button component
function ActionButton({
  action,
  isPrimary,
  onComplete
}: {
  action: UserFriendlyError['recoveryActions'][0];
  isPrimary: boolean;
  onComplete: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await action.handler();
      // Close dialog after successful action
      if (action.action === 'retry' || action.action === 'refresh_auth') {
        onComplete();
      }
    } catch (error) {
      console.error('Recovery action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = isPrimary
    ? 'w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center'
    : 'w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition-colors flex items-center justify-center';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </>
      ) : (
        action.label
      )}
    </button>
  );
}

// Technical details component for development
function TechnicalDetails({ error }: { error: UserFriendlyError }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        Technical Details
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(
              {
                id: error.id,
                severity: error.severity,
                timestamp: error.timestamp,
                recoveryActions: error.recoveryActions.map(a => a.action)
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-medium z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
        </svg>
        <span>You're currently offline. Some features may not be available.</span>
      </div>
    </div>
  );
}