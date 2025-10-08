import { SupabaseConnectionTest } from '~/components/supabase-connection-test';
import { DebugAuth } from '~/components/debug-auth';

export default function DebugSupabasePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔧 Debug Supabase</h1>
          <p className="text-gray-600">
            Esta página ajuda a diagnosticar problemas de conexão com o Supabase.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔍 Testes de Conectividade</h2>
            <SupabaseConnectionTest />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔐 Status de Autenticação</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <DebugAuth />
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">📋 Próximos Passos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-green-700 mb-2">✅ Se todos os testes passaram:</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Vá para <a href="/login" className="text-blue-600 hover:underline">/login</a></li>
                <li>• Tente fazer login normalmente</li>
                <li>• O problema pode ter sido resolvido</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-red-700 mb-2">❌ Se há falhas:</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Verifique sua conexão com a internet</li>
                <li>• Execute os scripts: <code className="bg-gray-100 px-1 rounded">./bootstrap.sh</code></li>
                <li>• Reinicie o servidor: <code className="bg-gray-100 px-1 rounded">./start-dev.sh</code></li>
                <li>• Verifique o console do navegador (F12)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">💡 Dica</h3>
          <p className="text-sm text-yellow-700">
            Esta página é temporária para debug. Após resolver os problemas, acesse{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">/login</a>{' '}
            para usar a aplicação normalmente.
          </p>
        </div>
      </div>
    </div>
  );
} 