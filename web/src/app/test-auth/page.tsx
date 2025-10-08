import { SimpleAuthTest } from '~/components/simple-auth-test';
import { EnvTest } from '~/components/env-test';

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Teste Completo</h1>
          <p className="text-gray-600">
            Diagnóstico completo para identificar problemas de configuração
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">🔧 Variáveis de Ambiente</h2>
            <EnvTest />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">🔐 Teste de Autenticação</h2>
            <SimpleAuthTest />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Se o teste passar, vá para{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              /login
            </a>
          </p>
          <p className="mt-2">
            Testes detalhados:{' '}
            <a href="/debug-supabase" className="text-blue-600 hover:underline">
              /debug-supabase
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 