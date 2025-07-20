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
        fetch: (url, options = {}) => {
          // Add cache headers for better performance
          return fetch(url, {
            ...options,
            cache: 'no-store', // Prevent stale data
          });
        },
      }
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