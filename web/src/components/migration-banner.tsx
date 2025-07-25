"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useAuth } from "~/core/contexts/auth-context";
import {
  migrateAllUserData,
  isMigrationCompleted,
  getMigrationStatus,
  clearLocalStorageData
} from "~/utils/migration/localStorage-to-supabase";

export function MigrationBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  
  useEffect(() => {
    // Verificar se há dados no localStorage e se a migração ainda não foi feita
    if (user && !isMigrationCompleted()) {
      const hasLocalData = 
        localStorage.getItem('deerflow.history') ||
        localStorage.getItem('jarvis-notes') ||
        localStorage.getItem('jarvis-calendar-events') ||
        localStorage.getItem('kanban-projects-v2') ||
        localStorage.getItem('jarvis-health-data');
      
      if (hasLocalData) {
        setShowBanner(true);
      }
    }
  }, [user]);
  
  const handleMigration = async () => {
    if (!user) return;
    
    setIsMigrating(true);
    setMigrationError(null);
    
    try {
      const status = await migrateAllUserData(user.id);
      setMigrationStatus(status);
      
      // Verificar se tudo foi migrado com sucesso
      const allSuccess = Object.values(status).every(success => success);
      
      if (allSuccess) {
        // Opcionalmente limpar localStorage
        // clearLocalStorageData();
        setShowBanner(false);
      } else {
        setMigrationError("Alguns dados não foram migrados completamente. Verifique o console para detalhes.");
      }
    } catch (error) {
      console.error("Erro na migração:", error);
      setMigrationError("Ocorreu um erro durante a migração. Por favor, tente novamente.");
    } finally {
      setIsMigrating(false);
    }
  };
  
  const handleDismiss = () => {
    setShowBanner(false);
    // Salvar que o usuário optou por não migrar agora
    localStorage.setItem('deepflow.migration.dismissed', new Date().toISOString());
  };
  
  if (!showBanner || !user) return null;
  
  return (
    <Alert className="mx-4 mt-4 border-blue-500/20 bg-blue-500/10">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">Migração de Dados Disponível</p>
          <p className="text-xs text-muted-foreground mt-1">
            Detectamos dados salvos localmente. Deseja migrar para a nuvem para sincronização entre dispositivos?
          </p>
          {migrationError && (
            <p className="text-xs text-red-500 mt-2">{migrationError}</p>
          )}
          {migrationStatus && (
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(migrationStatus).map(([key, success]) => (
                <div key={key} className="flex items-center gap-2">
                  {success ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="capitalize">{key}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isMigrating}
          >
            Depois
          </Button>
          <Button
            size="sm"
            onClick={handleMigration}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Migrando...
              </>
            ) : (
              "Migrar Agora"
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}