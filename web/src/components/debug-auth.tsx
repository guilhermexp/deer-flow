'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '~/lib/supabase/client';

export function DebugAuth() {
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const testSupabase = async () => {
      try {
        setStatus('Testing Supabase connection...');
        const supabase = getSupabaseClient();
        
        // Test basic connection
        setStatus('Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          setStatus('Session check failed');
          return;
        }
        
        if (session) {
          setStatus(`Authenticated as: ${session.user?.email}`);
        } else {
          setStatus('No active session - needs login');
        }
        
        // Test database connection
        setStatus('Testing database connection...');
        const { data, error: dbError } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
          
        if (dbError) {
          setError(`Database error: ${dbError.message}`);
          setStatus('Database connection failed');
          return;
        }
        
        setStatus(session ? `✅ All good! User: ${session.user?.email}` : '✅ Connection OK, please login');
        
      } catch (err: any) {
        setError(`Exception: ${err.message}`);
        setStatus('❌ Failed');
      }
    };
    
    testSupabase();
  }, []);
  
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
      <p className="text-sm">{status}</p>
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}