'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '~/lib/supabase/client';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    const checkStatus = async () => {
      const supabase = getSupabaseClient();
      const results: any = {};

      // Check session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        results.session = session ? 'Active' : 'No session';
        results.sessionError = error?.message;
      } catch (e: any) {
        results.sessionError = e.message;
      }

      // Check Supabase URL
      results.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';
      results.hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Try to query a public table
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        results.dbConnection = error ? `Error: ${error.message}` : 'Connected';
        results.profilesCount = data;
      } catch (e: any) {
        results.dbConnection = `Error: ${e.message}`;
      }

      setStatus(results);
    };

    checkStatus();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
        {JSON.stringify(status, null, 2)}
      </pre>
      <div className="mt-4">
        <a href="/login" className="text-blue-500 hover:underline">
          Go to Login →
        </a>
      </div>
    </div>
  );
}