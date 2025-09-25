/**
 * Hook for handling errors in React components
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { isAPIError, getErrorMessage, ErrorCodes } from '~/core/api/errors';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  fallbackMessage?: string;
  onError?: (error: unknown) => void;
  retryable?: boolean;
}

export function useErrorHandler(defaultOptions?: ErrorHandlerOptions) {
  const [error, setError] = useState<unknown>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error: unknown, options?: ErrorHandlerOptions) => {
    const opts = { showToast: true, ...defaultOptions, ...options };
    
    // Log error for debugging
    console.error('Error caught by useErrorHandler:', error);
    
    // Set error state
    setError(error);
    
    // Get user-friendly message
    const message = getErrorMessage(error);
    
    // Show toast notification if enabled
    if (opts.showToast) {
      // Special handling for certain error types
      if (isAPIError(error)) {
        switch (error.code) {
          case ErrorCodes.AUTH_ERROR:
            toast.error('Please sign in to continue', {
              action: {
                label: 'Sign In',
                onClick: () => window.location.href = '/login',
              },
            });
            break;
          
          case ErrorCodes.RATE_LIMIT:
            const retryAfter = error.extraData?.retry_after;
            toast.error(message, {
              description: retryAfter ? `Try again in ${retryAfter} seconds` : undefined,
            });
            break;
          
          case ErrorCodes.NETWORK_ERROR:
            toast.error(message, {
              action: opts.retryable ? {
                label: 'Retry',
                onClick: () => window.location.reload(),
              } : undefined,
            });
            break;
          
          default:
            toast.error(opts.fallbackMessage || message);
        }
      } else {
        toast.error(opts.fallbackMessage || message);
      }
    }
    
    // Call custom error handler if provided
    opts.onError?.(error);
  }, [defaultOptions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (fn: () => Promise<any>) => {
    setIsRetrying(true);
    clearError();
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
  };
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options?: ErrorHandlerOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { error, handleError, clearError, isRetrying } = useErrorHandler(options);

  const execute = useCallback(async (...args: any[]) => {
    setIsLoading(true);
    clearError();
    
    try {
      const result = await operation(...args);
      setData(result);
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operation, handleError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    clearError();
    setIsLoading(false);
  }, [clearError]);

  return {
    execute,
    reset,
    isLoading: isLoading || isRetrying,
    data,
    error,
  };
}