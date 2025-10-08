// Supabase Client Configuration for Deep-flow

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '~/types/supabase'

// Create a Supabase client for browser-side operations
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      db: {
        schema: 'public'
      },
      global: {
        fetch: async (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            return await fetch(url, {
              ...options,
              cache: 'no-store', // Prevent stale data
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
            // Explicitly abort to release resources
            controller.abort();
          }
        },
      },
      // Additional settings for development reliability
      ...(process.env.NODE_ENV === 'development' && {
        realtime: {
          params: {
            eventsPerSecond: 2, // Reduce event frequency in development
          },
        },
      })
    }
  )
}

// Singleton instance for convenience
let browserClient: ReturnType<typeof createClient> | undefined

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}