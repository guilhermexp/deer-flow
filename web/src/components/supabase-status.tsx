'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  const checkStatus = async () => {
    setStatus('checking');
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setStatus('not-configured');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      });
      
      if (response.ok) {
        setStatus('connected');
      } else {
        setStatus('error');
        setErrorMessage(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'connected') {
    return null; // Don't show anything if connected
  }

  if (status === 'not-configured') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Supabase não configurado</AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            <p>As variáveis de ambiente do Supabase não estão configuradas.</p>
            <p className="text-sm">Por favor, crie um arquivo <code className="bg-red-900/20 px-1 rounded">.env</code> com:</p>
            <pre className="text-xs bg-red-900/20 p-2 rounded mt-2">
NEXT_PUBLIC_SUPABASE_URL=sua-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave
            </pre>
            <p className="text-sm mt-2">
              Veja o arquivo <code className="bg-red-900/20 px-1 rounded">SETUP_COMPLETO_SUPABASE.md</code> para instruções detalhadas.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Problema de conexão com Supabase</AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            <p>Não foi possível conectar ao Supabase: {errorMessage}</p>
            <p className="text-sm">Verifique sua conexão com a internet e as configurações do Supabase.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={checkStatus}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}