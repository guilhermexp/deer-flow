"use client";

import React from "react";
import { Loader, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { iconMapping, getIconColorClass } from "~/lib/input-modal-utils";

interface WebhookStatusProps {
  processStatus: "idle" | "processing" | "success" | "error";
  errorMessage: string;
  type: string;
  title: string;
  onRetry: () => void;
}

export const WebhookStatus = React.memo(
  ({
    processStatus,
    errorMessage,
    type,
    title,
    onRetry,
  }: WebhookStatusProps) => {
    if (processStatus === "idle") return null;

    const CurrentIcon: React.ElementType =
      iconMapping[type as keyof typeof iconMapping] ??
      iconMapping.pdf ??
      FileText;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center justify-center gap-4">
            {processStatus === "processing" && (
              <>
                {React.createElement(CurrentIcon, {
                  className: cn("w-12 h-12 mb-4", getIconColorClass(type)),
                })}
                <span className="text-xl text-white">
                  Processando {title.replace("Adicionar ", "").toLowerCase()}...
                </span>
                <Loader className="mt-2 h-8 w-8 animate-spin text-blue-400" />
                <p className="mt-2 text-sm text-gray-400">
                  Gerando resumo e transcrição via IA
                </p>
              </>
            )}

            {processStatus === "success" && (
              <>
                <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                <span className="text-xl text-white">
                  Processamento concluído!
                </span>
                <p className="text-sm text-gray-400">
                  Redirecionando para a nota...
                </p>
              </>
            )}

            {processStatus === "error" && (
              <>
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <span className="text-xl text-white">
                  Erro no processamento
                </span>
                <p className="text-sm text-gray-400">{errorMessage}</p>
                <Button onClick={onRetry} className="mt-4" size="sm">
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

WebhookStatus.displayName = "WebhookStatus";
