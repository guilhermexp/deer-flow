"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useUser } from "@clerk/nextjs";
import { migrateLocalStorageToSupabase } from "~/utils/migration/localStorage-to-supabase";

export function MigrationBanner() {
  const { user } = useUser();
  const [showBanner, setShowBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [dataCount, setDataCount] = useState({ threads: 0, messages: 0 });
  
  useEffect(() => {
    // Check if migration was already dismissed
    const dismissed = localStorage.getItem('migrationBannerDismissed');
    if (dismissed) return;
    
    // Check if there's data to migrate
    const threadsData = localStorage.getItem('deer-flow-threads');
    if (threadsData && user) {
      try {
        const threads = JSON.parse(threadsData);
        if (Array.isArray(threads) && threads.length > 0) {
          const totalMessages = threads.reduce((sum, thread) => {
            return sum + (thread.messages ? thread.messages.length : 0);
          }, 0);
          setDataCount({ threads: threads.length, messages: totalMessages });
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Error parsing threads data:', error);
      }
    }
  }, [user]);
  
  const handleMigration = async () => {
    if (!user) return;
    
    setIsMigrating(true);
    setMigrationError(null);
    
    try {
      const result = await migrateLocalStorageToSupabase();
      
      if (result.success) {
        setMigrationStatus({
          migratedThreads: result.migratedThreads ?? 0,
          migratedMessages: result.migratedMessages ?? 0
        });
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          handleDismiss();
        }, 5000);
      } else {
        setMigrationError(result.error ?? 'Unknown error');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationError('Ocorreu um erro durante a migração. Por favor, tente novamente.');
    } finally {
      setIsMigrating(false);
    }
  };
  
  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('migrationBannerDismissed', 'true');
  };
  
  if (!showBanner || !user) return null;
  
  return (
    <Alert className="mx-4 mt-4 border-blue-500/20 bg-blue-500/10">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">Migrar dados locais</p>
          <p className="text-xs text-muted-foreground mt-1">
            Encontramos {dataCount.threads} conversas e {dataCount.messages} mensagens salvos localmente. Migrar para sincronização?
          </p>
          {migrationError && (
            <p className="text-xs text-red-500 mt-2">{migrationError}</p>
          )}
          {migrationStatus && (
            <div className="mt-2 text-xs">
              <div className="text-green-600">
                Migração concluída: {migrationStatus.migratedThreads} conversas e {migrationStatus.migratedMessages} mensagens
              </div>
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
            Descartar
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
              "Migrar agora"
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}