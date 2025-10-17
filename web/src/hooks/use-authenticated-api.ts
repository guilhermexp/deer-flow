/**
 * React hook for authenticated API calls with Clerk
 *
 * This hook provides an API client that automatically includes
 * Clerk authentication tokens in all requests.
 */

import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

import { httpClient } from '~/services/api/http-client';

export interface AuthenticatedApiClient {
  get: <T = any>(endpoint: string) => Promise<T>;
  post: <T = any>(endpoint: string, body?: any) => Promise<T>;
  put: <T = any>(endpoint: string, body?: any) => Promise<T>;
  patch: <T = any>(endpoint: string, body?: any) => Promise<T>;
  delete: <T = any>(endpoint: string) => Promise<T>;
}

/**
 * Hook that provides an authenticated API client
 * Automatically includes Clerk session tokens in all requests
 *
 * @returns Authenticated API client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useAuthenticatedApi();
 *
 *   const fetchData = async () => {
 *     try {
 *       const events = await api.get('/calendar/events');
 *       console.log(events);
 *     } catch (error) {
 *       console.error('Failed to fetch events:', error);
 *     }
 *   };
 *
 *   return <button onClick={fetchData}>Fetch Data</button>;
 * }
 * ```
 */
export function useAuthenticatedApi(): AuthenticatedApiClient {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    return {
      get: async <T = any>(endpoint: string): Promise<T> => {
        const token = await getToken();
        return httpClient<T>(endpoint, {
          method: 'GET',
          token: token ?? undefined,
        });
      },

      post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
        const token = await getToken();
        return httpClient<T>(endpoint, {
          method: 'POST',
          body,
          token: token ?? undefined,
        });
      },

      put: async <T = any>(endpoint: string, body?: any): Promise<T> => {
        const token = await getToken();
        return httpClient<T>(endpoint, {
          method: 'PUT',
          body,
          token: token ?? undefined,
        });
      },

      patch: async <T = any>(endpoint: string, body?: any): Promise<T> => {
        const token = await getToken();
        return httpClient<T>(endpoint, {
          method: 'PATCH',
          body,
          token: token ?? undefined,
        });
      },

      delete: async <T = any>(endpoint: string): Promise<T> => {
        const token = await getToken();
        return httpClient<T>(endpoint, {
          method: 'DELETE',
          token: token ?? undefined,
        });
      },
    };
  }, [getToken]);

  return api;
}
