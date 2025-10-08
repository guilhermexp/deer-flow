// Simplified Supabase client for debugging

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/supabase'

// Create a minimal Supabase client without customizations
export function createSimpleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log('🔍 Simple Client Debug:');
  console.log(`- URL: ${url ? 'defined' : 'undefined'}`);
  console.log(`- Key: ${key ? 'defined' : 'undefined'}`);
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create client with minimal configuration
  return createBrowserClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
}

// Test function to compare clients
export async function testSimpleClient() {
  try {
    const client = createSimpleClient();
    
    console.log('🧪 Testing simple client...');
    
    // Test session
    const { data: session, error: sessionError } = await client.auth.getSession();
    console.log('- Session:', session?.session ? 'found' : 'not found');
    console.log('- Session error:', sessionError?.message || 'none');
    
    // Test API call
    const { data, error } = await client
      .from('user_profiles')
      .select('count')
      .limit(1);
      
    console.log('- API response:', data ? 'success' : 'failed');
    console.log('- API error:', error?.message || 'none');
    
    return { success: !error, error: error?.message };
  } catch (err) {
    console.error('Simple client test failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}