'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { getSupabaseClient } from '~/lib/supabase/client';
import { testSimpleClient } from '~/lib/supabase/client-simple';

export default function DebugSupabaseClientPage() {
  const [results, setResults] = useState<{
    envVars?: { url?: string; key?: string };
    clientConfig?: any;
    testResults?: any;
    tested: boolean;
  }>({ tested: false });

  const runDiagnostics = async () => {
    console.log('🔍 Starting Supabase client diagnostics...');
    
    try {
      // 1. Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Environment Variables:');
      console.log('- URL:', url ? `${url.substring(0, 30)}...` : 'undefined');
      console.log('- Key:', key ? `${key.substring(0, 50)}...` : 'undefined');
      
      // 2. Test client creation
      const client = getSupabaseClient();
      console.log('- Client created:', !!client);
      
      // 3. Test auth.getSession()
      console.log('🔐 Testing auth.getSession()...');
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      console.log('- Session data:', sessionData);
      console.log('- Session error:', sessionError);
      
      // 4. Test simple API call
      console.log('🌐 Testing simple API call...');
      const { data: testData, error: testError } = await client
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('- API call data:', testData);
      console.log('- API call error:', testError);
      
      // 5. Test simple client (without customizations)
      console.log('🧪 Testing simple client...');
      const simpleClientResult = await testSimpleClient();
      console.log('- Simple client result:', simpleClientResult);
      
      // 6. Check client configuration
      const clientConfig = {
        supabaseUrl: (client as any).supabaseUrl,
        supabaseKey: (client as any).supabaseKey ? `${(client as any).supabaseKey.substring(0, 20)}...` : 'undefined',
        hasAuth: !!(client as any).auth,
        hasRest: !!(client as any).rest,
      };
      
      setResults({
        envVars: {
          url: url ? `${url.substring(0, 30)}...` : undefined,
          key: key ? `${key.substring(0, 50)}...` : undefined,
        },
        clientConfig,
        testResults: {
          sessionData: sessionData?.session ? 'Session found' : 'No session',
          sessionError: sessionError?.message || 'No error',
          apiData: testData ? `Got ${testData.length || 0} results` : 'No data',
          apiError: testError?.message || 'No error',
          simpleClient: simpleClientResult.success ? '✅ Simple client works' : `❌ ${simpleClientResult.error}`,
        },
        tested: true,
      });
      
    } catch (error) {
      console.error('Diagnostic error:', error);
      setResults({
        testResults: { error: error instanceof Error ? error.message : 'Unknown error' },
        tested: true,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🔍 Supabase Client Diagnostics</h1>
      
      <div className="space-y-4">
        <Button onClick={runDiagnostics} className="w-full">
          Run Diagnostics
        </Button>
        
        {results.tested && (
          <>
            {/* Environment Variables */}
            {results.envVars && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Environment Variables</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div>URL: {results.envVars.url || '❌ Not found'}</div>
                  <div>Key: {results.envVars.key || '❌ Not found'}</div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Client Configuration */}
            {results.clientConfig && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Client Configuration</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div>Supabase URL: {results.clientConfig.supabaseUrl}</div>
                  <div>Supabase Key: {results.clientConfig.supabaseKey}</div>
                  <div>Has Auth: {results.clientConfig.hasAuth ? '✅' : '❌'}</div>
                  <div>Has REST: {results.clientConfig.hasRest ? '✅' : '❌'}</div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Test Results */}
            {results.testResults && (
              <Alert variant={results.testResults.error ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Test Results</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  {results.testResults.error ? (
                    <div>❌ Error: {results.testResults.error}</div>
                  ) : (
                    <>
                      <div>Session: {results.testResults.sessionData}</div>
                      <div>Session Error: {results.testResults.sessionError}</div>
                      <div>API Call: {results.testResults.apiData}</div>
                      <div>API Error: {results.testResults.apiError}</div>
                      <div>Simple Client: {results.testResults.simpleClient}</div>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Instructions</AlertTitle>
          <AlertDescription>
            1. Click "Run Diagnostics" to test the Supabase client<br/>
            2. Open Developer Console (F12) to see detailed logs<br/>
            3. Check the results above for any configuration issues
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}