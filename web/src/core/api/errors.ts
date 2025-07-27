/**
 * Custom error classes and utilities for API error handling
 */

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface APIErrorResponse {
  error_code: string;
  message: string;
  details?: ErrorDetail[];
  request_id: string;
  timestamp: string;
  status_code: number;
  extra_data?: Record<string, any>;
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ErrorDetail[];
  public readonly requestId?: string;
  public readonly timestamp?: string;
  public readonly extraData?: Record<string, any>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ErrorDetail[],
    requestId?: string,
    timestamp?: string,
    extraData?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = timestamp;
    this.extraData = extraData;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Check if the error is of a specific type
   */
  isType(code: string): boolean {
    return this.code === code;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    // Special handling for common error types
    switch (this.code) {
      case 'AUTH_ERROR':
        return 'Please sign in to continue';
      case 'RATE_LIMIT':
        return 'Too many requests. Please try again later';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your internet connection';
      case 'TIMEOUT':
        return 'Request timed out. Please try again';
      default:
        return this.message || 'An unexpected error occurred';
    }
  }
}

/**
 * Error codes for different types of errors
 */
export const ErrorCodes = {
  // Client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Custom errors
  LLM_ERROR: 'LLM_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Parse API response and handle errors
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  // Add request ID to subsequent requests if available
  const requestId = response.headers.get('X-Request-ID');
  if (requestId && typeof window !== 'undefined') {
    // Store for next request
    window.sessionStorage.setItem('last-request-id', requestId);
  }

  if (!response.ok) {
    let errorData: APIErrorResponse | null = null;
    
    try {
      errorData = await response.json() as APIErrorResponse;
    } catch {
      // If we can't parse the error response, create a generic one
      throw new APIError(
        response.status,
        'UNKNOWN_ERROR',
        response.statusText || `HTTP error ${response.status}`,
        undefined,
        requestId || undefined
      );
    }

    throw new APIError(
      errorData.status_code || response.status,
      errorData.error_code || 'UNKNOWN_ERROR',
      errorData.message || response.statusText,
      errorData.details,
      errorData.request_id || requestId || undefined,
      errorData.timestamp,
      errorData.extra_data
    );
  }

  // Handle empty responses
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');
  
  if (contentLength === '0' || !contentType?.includes('application/json')) {
    return {} as T;
  }

  try {
    return await response.json() as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new APIError(
      500,
      'PARSE_ERROR',
      'Failed to parse server response',
      undefined,
      requestId || undefined
    );
  }
}

/**
 * Create a network error
 */
export function createNetworkError(error: unknown): APIError {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new APIError(
      0,
      ErrorCodes.NETWORK_ERROR,
      'Unable to connect to the server. Please check your internet connection.'
    );
  }

  if (error instanceof Error) {
    return new APIError(
      0,
      ErrorCodes.NETWORK_ERROR,
      error.message
    );
  }

  return new APIError(
    0,
    ErrorCodes.NETWORK_ERROR,
    'An unknown network error occurred'
  );
}

/**
 * Check if an error is an API error
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}