'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function EnvTest() {
  const [result, setResult] = useState<{
    url?: string;
    key?: string;
    urlOk: boolean;
    keyOk: boolean;
    tested: boolean;
  }>({ urlOk: false, keyOk: false, tested: false });

  const testEnv = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🧪 Testing environment variables:');
    console.log('URL:', url);
    console.log('Key length:', key?.length);
    
    setResult({
      url: url ? `${url.substring(0, 30)}...` : 'undefined',
      key: key ? `${key.substring(0, 20)}...` : 'undefined',
      urlOk: !!url && url.includes('supabase.co'),
      keyOk: !!key && key.length > 100,
      tested: true
    });
  };

  const testDirectAPI = async () => {
    try {
      console.log('🧪 Testing direct API call...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        }
      });
      
      console.log('✅ Direct API Response:', response.status);
      alert(`Direct API call: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.error('❌ Direct API failed:', error);
      alert(`Direct API error: ${error}`);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={result.tested && result.urlOk && result.keyOk ? 'default' : 'destructive'}>
        {result.tested && result.urlOk && result.keyOk ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>Teste de Variáveis de Ambiente</AlertTitle>
        <AlertDescription>
          {!result.tested && 'Clique para testar as variáveis de ambiente'}
          {result.tested && (
            <div className="space-y-1 text-xs">
              <div>URL: {result.url} {result.urlOk ? '✅' : '❌'}</div>
              <div>Key: {result.key} {result.keyOk ? '✅' : '❌'}</div>
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Button onClick={testEnv} className="w-full">
          Testar Variáveis ENV
        </Button>
        
        <Button onClick={testDirectAPI} variant="outline" className="w-full">
          Testar API Direta
        </Button>
      </div>
    </div>
  );
} 