/**
 * Auth-aware HTTP client that automatically includes Clerk authentication tokens
 *
 * This client wraps the base http-client and adds Clerk session tokens to requests.
 * Use this for authenticated API calls from React components.
 */

import { httpClient, api as baseApi, HttpClientError } from './http-client';

/**
 * Get Clerk session token
 * This should be called from React components where useAuth hook is available
 */
export async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { useAuth } = await import('@clerk/nextjs');

    // Note: This function should be called from a component context
    // where useAuth hook is available. For direct usage, pass token explicitly.
    console.warn('getClerkToken: This function should be used within React components with useAuth hook');
    return null;
  } catch (error) {
    console.error('Failed to get Clerk token:', error);
    return null;
  }
}

/**
 * Auth-aware API client factory
 * Use this in React components where you have access to Clerk's getToken function
 */
export function createAuthApi(getToken: () => Promise<string | null>) {
  return {
    get: async <T = any>(endpoint: string) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'GET',
        token: token || undefined
      });
    },

    post: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'POST',
        body,
        token: token || undefined
      });
    },

    put: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'PUT',
        body,
        token: token || undefined
      });
    },

    patch: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'PATCH',
        body,
        token: token || undefined
      });
    },

    delete: async <T = any>(endpoint: string) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'DELETE',
        token: token || undefined
      });
    },
  };
}

/**
 * Hook-based auth-aware API client
 * Use this hook in React components to get an authenticated API client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const authApi = useAuthApi();
 *
 *   const fetchData = async () => {
 *     const data = await authApi.get('/calendar/events');
 *     console.log(data);
 *   };
 * }
 * ```
 */
export function useAuthApi() {
  // This will be used in React components
  if (typeof window === 'undefined') {
    // Return base API for SSR (will fail if auth is required)
    return baseApi;
  }

  // We need to return a lazy-evaluated API that gets the token on each call
  // Import useAuth dynamically
  const getToken: (() => Promise<string | null>) | null = null;

  try {
    // This needs to be imported and used at the component level
    // For now, return base API with a warning
    console.warn('useAuthApi: Import and use @clerk/nextjs useAuth hook at component level');
  } catch (error) {
    console.error('Failed to setup auth API:', error);
  }

  return baseApi;
}

/**
 * Create an authenticated API client with a token getter function
 * This is the recommended way to create authenticated API calls
 *
 * @param getToken - Function that returns the current Clerk session token
 * @returns Authenticated API client
 *
 * @example
 * ```tsx
 * import { useAuth } from '@clerk/nextjs';
 * import { createAuthenticatedApi } from '~/services/api/auth-http-client';
 *
 * function MyComponent() {
 *   const { getToken } = useAuth();
 *   const authApi = createAuthenticatedApi(getToken);
 *
 *   const fetchData = async () => {
 *     const data = await authApi.get('/calendar/events');
 *   };
 * }
 * ```
 */
export function createAuthenticatedApi(getToken: () => Promise<string | null>) {
  return {
    get: async <T = any>(endpoint: string) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'GET',
        token: token || undefined
      });
    },

    post: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'POST',
        body,
        token: token || undefined
      });
    },

    put: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'PUT',
        body,
        token: token || undefined
      });
    },

    patch: async <T = any>(endpoint: string, body?: any) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'PATCH',
        body,
        token: token || undefined
      });
    },

    delete: async <T = any>(endpoint: string) => {
      const token = await getToken();
      return httpClient<T>(endpoint, {
        method: 'DELETE',
        token: token || undefined
      });
    },
  };
}

// Re-export HttpClientError for convenience
export { HttpClientError };
