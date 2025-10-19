import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema de Autenticação</AlertTitle>
          <AlertDescription>
            Houve um problema com o sistema de autenticação. Isso pode acontecer
            quando há problemas de conectividade.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow-md">
          <h1 className="text-center text-2xl font-bold">
            🔧 Resolução Rápida
          </h1>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Tentar Login</Link>
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Se o problema persistir:</p>
          <ul className="mt-2 space-y-1">
            <li>• Verifique sua conexão com a internet</li>
            <li>• Recarregue a página (F5)</li>
            <li>
              • Execute:{" "}
              <code className="rounded bg-gray-100 px-1">./start-dev.sh</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
