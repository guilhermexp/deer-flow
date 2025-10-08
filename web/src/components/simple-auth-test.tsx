'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '~/lib/supabase/client';

export function SimpleAuthTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: 'Clique para testar' });

  const testAuth = async () => {
    setIsLoading(true);
    setResult({ status: 'idle', message: 'Testando...' });

    try {
      console.log('🧪 Starting simple auth test...');
      
      const supabase = getSupabaseClient();
      
      // Direct auth test with very short timeout
      const { data, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]) as { data: any; error: Error | null };

      if (error) {
        setResult({
          status: 'error',
          message: 'Erro na autenticação',
          details: error.message
        });
        return;
      }

      if (data?.session) {
        setResult({
          status: 'success',
          message: `✅ Usuário autenticado: ${data.session.user?.email}`,
          details: 'Sistema de autenticação funcionando'
        });
      } else {
        setResult({
          status: 'success',
          message: '✅ Sistema funcionando (sem sessão ativa)',
          details: 'Pronto para login'
        });
      }

    } catch (error) {
      console.error('Auth test failed:', error);
      
      if (error instanceof Error && error.message.includes('Timeout')) {
        setResult({
          status: 'error',
          message: '⏱️ Timeout na conexão',
          details: 'Verifique sua internet ou tente novamente'
        });
      } else {
        setResult({
          status: 'error',
          message: '❌ Erro no teste',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={result.status === 'error' ? 'destructive' : 'default'}>
        {result.status === 'success' && <CheckCircle2 className="h-4 w-4" />}
        {result.status === 'error' && <AlertCircle className="h-4 w-4" />}
        {result.status === 'idle' && <RefreshCw className="h-4 w-4" />}
        
        <AlertTitle>Teste Rápido de Autenticação</AlertTitle>
        <AlertDescription>
          {result.message}
          {result.details && (
            <div className="text-xs mt-2 font-mono">{result.details}</div>
          )}
        </AlertDescription>
      </Alert>

      <Button
        onClick={testAuth}
        disabled={isLoading}
        className="w-full"
        variant={result.status === 'success' ? 'default' : 'outline'}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Testando...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Testar Autenticação
          </>
        )}
      </Button>

      {result.status === 'success' && (
        <div className="text-center">
          <Button asChild>
            <a href="/login">Ir para Login →</a>
          </Button>
        </div>
      )}
    </div>
  );
} 