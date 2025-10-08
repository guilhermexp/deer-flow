'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseClient, testSupabaseConnection } from '~/lib/supabase/client';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export function SupabaseConnectionTest() {
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('testing');
    
    const testResults: ConnectionTest[] = [
      { name: 'Environment Variables', status: 'pending', message: 'Checking...' },
      { name: 'Supabase Client Creation', status: 'pending', message: 'Checking...' },
      { name: 'Basic Connection', status: 'pending', message: 'Checking...' },
      { name: 'Authentication System', status: 'pending', message: 'Checking...' },
      { name: 'Database Access', status: 'pending', message: 'Checking...' },
    ];

    setTests([...testResults]);

    try {
      // Test 1: Environment Variables
      const envVars = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };

      if (!envVars.url || !envVars.key) {
        testResults[0] = {
          name: 'Environment Variables',
          status: 'error',
          message: 'Missing environment variables',
          details: `URL: ${envVars.url ? '✅ Set' : '❌ Missing'}, Key: ${envVars.key ? '✅ Set' : '❌ Missing'}`
        };
      } else {
        testResults[0] = {
          name: 'Environment Variables',
          status: 'success',
          message: 'All required variables are set',
          details: `URL: ${envVars.url.substring(0, 30)}...`
        };
      }
      setTests([...testResults]);

      // Test 2: Supabase Client Creation
      try {
        const supabase = getSupabaseClient();
        testResults[1] = {
          name: 'Supabase Client Creation',
          status: 'success',
          message: 'Client created successfully'
        };
      } catch (error) {
        testResults[1] = {
          name: 'Supabase Client Creation',
          status: 'error',
          message: 'Failed to create client',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      setTests([...testResults]);

      // Test 3: Basic Connection
      try {
        const connectionOk = await testSupabaseConnection();
        testResults[2] = {
          name: 'Basic Connection',
          status: connectionOk ? 'success' : 'error',
          message: connectionOk ? 'Connection successful' : 'Connection failed'
        };
      } catch (error) {
        testResults[2] = {
          name: 'Basic Connection',
          status: 'error',
          message: 'Connection test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      setTests([...testResults]);

      // Test 4: Authentication System
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 8000)
          )
        ]) as { data: any; error: Error | null };

        if (error) {
          testResults[3] = {
            name: 'Authentication System',
            status: 'error',
            message: 'Auth system error',
            details: error.message
          };
        } else {
          testResults[3] = {
            name: 'Authentication System',
            status: 'success',
            message: data.session ? 'User authenticated' : 'Auth system working (no session)'
          };
        }
      } catch (error) {
        testResults[3] = {
          name: 'Authentication System',
          status: 'error',
          message: 'Auth test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      setTests([...testResults]);

      // Test 5: Basic API Access
      try {
        const supabase = getSupabaseClient();
        
        // Test basic API connectivity without requiring specific tables
        const testPromise = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json'
          }
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API test timeout')), 8000)
        );
        
        const response = await Promise.race([testPromise, timeoutPromise]) as Response;
        
        if (response.ok || response.status === 404) { // 404 is fine for base endpoint
          testResults[4] = {
            name: 'Basic API Access',
            status: 'success',
            message: 'API endpoint accessible',
            details: `Status: ${response.status}`
          };
        } else {
          testResults[4] = {
            name: 'Basic API Access',
            status: 'error',
            message: 'API request failed',
            details: `HTTP ${response.status}`
          };
        }
      } catch (error) {
        testResults[4] = {
          name: 'Basic API Access',
          status: 'error',
          message: 'API test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setTests([...testResults]);

      // Determine overall status
      const hasErrors = testResults.some(test => test.status === 'error');
      setOverallStatus(hasErrors ? 'error' : 'success');

    } catch (error) {
      console.error('Test suite failed:', error);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-4">
      <Alert variant={overallStatus === 'error' ? 'destructive' : overallStatus === 'success' ? 'default' : 'default'}>
        {overallStatus === 'error' ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
        <AlertTitle>Diagnóstico de Conexão Supabase</AlertTitle>
        <AlertDescription>
          {overallStatus === 'testing' && 'Executando testes de conectividade...'}
          {overallStatus === 'success' && 'Todos os testes passaram! ✅'}
          {overallStatus === 'error' && 'Alguns testes falharam. Verifique os detalhes abaixo.'}
          {overallStatus === 'idle' && 'Pronto para executar testes.'}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              test.status === 'success'
                ? 'border-green-200 bg-green-50'
                : test.status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {test.status === 'pending' && <RefreshCw className="h-4 w-4 animate-spin" />}
              {test.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {test.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <span className="font-medium">{test.name}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{test.message}</p>
            {test.details && (
              <p className="text-xs text-gray-500 mt-1 font-mono">{test.details}</p>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={runTests}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Executando testes...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Executar testes novamente
          </>
        )}
      </Button>
    </div>
  );
} 