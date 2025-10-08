'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (title: string, success: boolean, details: any) => {
    setResults(prev => [...prev, { 
      title, 
      success, 
      details, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const testDirectLogin = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      // 1. Test ENV variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      addResult('1️⃣ Variáveis ENV', !!url && !!key, {
        url: url ? `${url.substring(0, 30)}...` : 'MISSING',
        keyLength: key?.length || 0
      });

      if (!url || !key) {
        throw new Error('Missing environment variables');
      }

      // 2. Create client
      const supabase = createClient(url, key);
      addResult('2️⃣ Cliente criado', true, { clientCreated: true });

      // 3. Test connection
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        addResult('3️⃣ Conexão testada', true, { 
          hasSession: !!sessionData?.session 
        });
      } catch (error) {
        addResult('3️⃣ Conexão testada', false, { error: String(error) });
      }

      // 4. Attempt login
      console.log('🔐 Attempting login with:', { email, password: '***' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addResult('4️⃣ Login', false, {
          error: error.message,
          status: error.status,
          code: error.code
        });
        
        // Test if it's a network issue
        try {
          const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': key,
            },
            body: JSON.stringify({ email, password })
          });
          
          const result = await response.json();
          addResult('5️⃣ API Direta', response.ok, {
            status: response.status,
            result
          });
        } catch (fetchError) {
          addResult('5️⃣ API Direta', false, { 
            error: String(fetchError) 
          });
        }
      } else {
        addResult('4️⃣ Login', true, {
          user: data.user?.email,
          session: !!data.session,
          expiresAt: data.session?.expires_at
        });
      }

    } catch (error) {
      addResult('❌ Erro geral', false, { 
        error: String(error) 
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
            <CardTitle>🔍 Teste Direto de Login</CardTitle>
            <CardDescription>
              Diagnóstico completo do processo de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={testDirectLogin} 
                disabled={isLoading || !email || !password}
                className="w-full"
              >
                {isLoading ? 'Testando...' : 'Testar Login'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Resultados do Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                    <AlertTitle className="flex items-center gap-2">
                      {result.success ? '✅' : '❌'} {result.title}
                    </AlertTitle>
                    <AlertDescription>
                      <pre className="text-xs mt-2 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}