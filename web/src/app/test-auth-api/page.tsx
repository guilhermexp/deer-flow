'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '~/core/contexts/auth-context';
import { getSupabaseClient } from '~/lib/supabase/client';

export default function TestAuthApi() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>({});
  
  useEffect(() => {
    async function runTests() {
      const results: any = {};
      
      // 1. Verificar autenticação
      results.auth = {
        isAuthenticated,
        user: user ? { id: user.id, email: user.email } : null,
        isLoading
      };
      
      // 2. Verificar sessão Supabase
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      results.supabase = {
        hasSession: !!session,
        sessionError: error?.message,
        userId: session?.user?.id,
        email: session?.user?.email,
        hasToken: !!session?.access_token
      };
      
      // 3. Testar chamada ao backend
      if (session?.access_token) {
        try {
          const response = await fetch('http://localhost:8005/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'teste de autenticação' }],
              thread_id: 'test-auth-' + Date.now()
            })
          });
          
          results.backendCall = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          };
          
          if (!response.ok) {
            const text = await response.text();
            results.backendCall.error = text;
          }
        } catch (error: any) {
          results.backendCall = {
            error: error.message
          };
        }
      } else {
        results.backendCall = {
          error: 'No auth token available'
        };
      }
      
      setTestResults(results);
    }
    
    if (!isLoading) {
      runTests();
    }
  }, [user, isAuthenticated, isLoading]);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Autenticação e API</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">1. Estado da Autenticação</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResults.auth, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">2. Sessão Supabase</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResults.supabase, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">3. Chamada ao Backend</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResults.backendCall, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Resumo:</h2>
        {testResults.auth?.isAuthenticated ? (
          <p className="text-green-400">✅ Usuário autenticado no frontend</p>
        ) : (
          <p className="text-red-400">❌ Usuário não autenticado no frontend</p>
        )}
        
        {testResults.supabase?.hasSession ? (
          <p className="text-green-400">✅ Sessão Supabase ativa</p>
        ) : (
          <p className="text-red-400">❌ Sem sessão Supabase</p>
        )}
        
        {testResults.backendCall?.ok ? (
          <p className="text-green-400">✅ Backend aceitou autenticação</p>
        ) : (
          <p className="text-red-400">❌ Backend rejeitou autenticação: {testResults.backendCall?.error || testResults.backendCall?.statusText}</p>
        )}
      </div>
    </div>
  );
}