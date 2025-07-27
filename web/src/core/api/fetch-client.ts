/**
 * Modern fetch-based API client with proper error handling
 */

import { handleAPIResponse, createNetworkError, APIError } from './errors';
import { env } from '~/env.js';

const API_URL = env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005/api';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Get Supabase auth token
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const { getSupabaseClient } = await import('~/lib/supabase/client');
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase getSession error:', error);
      return null;
    }
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get Supabase session:', error);
    return null;
  }
}

/**
 * Add request ID header if available
 */
function addRequestIdHeader(headers: Headers): void {
  if (typeof window !== 'undefined') {
    const lastRequestId = window.sessionStorage.getItem('last-request-id');
    if (lastRequestId) {
      headers.set('X-Parent-Request-ID', lastRequestId);
    }
  }
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError(0, 'TIMEOUT', `Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry support
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
  retries: number = 0,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: unknown;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options, options.timeout);
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (i === retries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
    }
  }

  throw lastError;
}

/**
 * Main fetch client
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Add auth token
  const token = await getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add request ID tracking
  addRequestIdHeader(headers);

  const fetchOptions: FetchOptions = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetchWithRetry(
      url,
      fetchOptions,
      options.retries ?? 0,
      options.retryDelay ?? 1000
    );

    return await handleAPIResponse<T>(response);
  } catch (error) {
    // Convert network errors to our error format
    if (error instanceof TypeError || (error instanceof Error && !('status' in error))) {
      throw createNetworkError(error);
    }
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Export for backwards compatibility
export default api;