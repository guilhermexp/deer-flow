"use client"

import React from "react"
import { Loader, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { iconMapping, getIconColorClass } from "~/lib/input-modal-utils"

interface WebhookStatusProps {
  processStatus: "idle" | "processing" | "success" | "error"
  errorMessage: string
  type: string
  title: string
  onRetry: () => void
}

export const WebhookStatus = React.memo(
  ({ processStatus, errorMessage, type, title, onRetry }: WebhookStatusProps) => {
    if (processStatus === "idle") return null

    const CurrentIcon: React.ElementType = iconMapping[type as keyof typeof iconMapping] ?? iconMapping.pdf ?? FileText

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-8 w-full max-w-md relative shadow-2xl text-center backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 justify-center">
            {processStatus === "processing" && (
              <>
                {React.createElement(CurrentIcon, {
                  className: cn("w-12 h-12 mb-4", getIconColorClass(type)),
                })}
                <span className="text-xl text-white">
                  Processando {title.replace("Adicionar ", "").toLowerCase()}...
                </span>
                <Loader className="w-8 h-8 text-blue-400 animate-spin mt-2" />
                <p className="text-sm text-gray-400 mt-2">
                  Gerando resumo e transcrição via IA
                </p>
              </>
            )}

            {processStatus === "success" && (
              <>
                <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
                <span className="text-xl text-white">Processamento concluído!</span>
                <p className="text-sm text-gray-400">Redirecionando para a nota...</p>
              </>
            )}

            {processStatus === "error" && (
              <>
                <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
                <span className="text-xl text-white">Erro no processamento</span>
                <p className="text-sm text-gray-400">{errorMessage}</p>
                <Button onClick={onRetry} className="mt-4" size="sm">
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
)

WebhookStatus.displayName = "WebhookStatus"