'use client';

import { useState } from 'react';
import { getSupabaseClient } from '~/lib/supabase/client';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { useAuth } from '~/core/contexts/auth-context';

export default function DebugAuthTokenPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const debugAuth = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    
    try {
      // 1. Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // 2. Check user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // 3. Try a simple API call
      let apiResult = null;
      try {
        const { data: apiData, error: apiError } = await supabase
          .from('projects')
          .select('*')
          .limit(1);
        
        apiResult = { data: apiData, error: apiError };
      } catch (apiErr) {
        apiResult = { error: String(apiErr) };
      }

      setDebugInfo({
        contextUser: user,
        contextIsAuthenticated: isAuthenticated,
        session: {
          data: sessionData,
          error: sessionError,
          hasAccessToken: !!sessionData?.session?.access_token,
          tokenLength: sessionData?.session?.access_token?.length || 0,
        },
        user: {
          data: userData,
          error: userError,
        },
        apiTest: apiResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDebugInfo({
        error: String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug de Token de Autenticação</CardTitle>
            <CardDescription>
              Verificar por que as chamadas API retornam 401
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={debugAuth} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Verificando...' : 'Verificar Autenticação'}
            </Button>
          </CardContent>
        </Card>

        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Resultado do Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert 
                variant={debugInfo.error || debugInfo.apiTest?.error ? 'destructive' : 'default'}
                className="mb-4"
              >
                <AlertTitle>
                  {debugInfo.error || debugInfo.apiTest?.error ? '❌ Problema encontrado' : '✅ Status da autenticação'}
                </AlertTitle>
                <AlertDescription>
                  {debugInfo.contextIsAuthenticated ? 
                    'Usuário autenticado no contexto' : 
                    'Usuário NÃO autenticado no contexto'
                  }
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1️⃣ Contexto Auth:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify({
                      user: debugInfo.contextUser,
                      isAuthenticated: debugInfo.contextIsAuthenticated
                    }, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2️⃣ Sessão Supabase:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify({
                      hasSession: !!debugInfo.session?.data?.session,
                      hasAccessToken: debugInfo.session?.hasAccessToken,
                      tokenLength: debugInfo.session?.tokenLength,
                      error: debugInfo.session?.error
                    }, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3️⃣ Usuário Supabase:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify({
                      hasUser: !!debugInfo.user?.data?.user,
                      userId: debugInfo.user?.data?.user?.id,
                      email: debugInfo.user?.data?.user?.email,
                      error: debugInfo.user?.error
                    }, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4️⃣ Teste API:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.apiTest, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">📄 Debug Completo:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}