"use client"

import { Button } from "~/components/ui/button"
import { FULL_DAY_NAMES_PT, formatTime, calculateSleepDuration } from "~/lib/jarvis/sleep-utils" // Usando nomes completos em Português
import type { SleepLogEntry } from "./sleep-dashboard"
import { CheckCircle, XCircle, Edit3 } from "lucide-react"

interface SleepHistoryProps {
  sleepLog: (SleepLogEntry | null)[]
  onEditLog: (dayIndex: number) => void
}

export default function SleepHistory({ sleepLog, onEditLog }: SleepHistoryProps) {
  return (
    <div className="space-y-4 p-2">
      <h3 className="text-lg font-semibold text-foreground mb-3">Registro Semanal de Sono</h3>
      {FULL_DAY_NAMES_PT.map((dayName, index) => {
        const log = sleepLog[index]
        let statusText = "Não Registrado"
        let durationText = ""
        let icon = <XCircle className="w-5 h-5 text-muted-foreground" />
        let bgColor = "bg-muted/50"

        if (log && log.status === "confirmed") {
          statusText = "Confirmado Agendado"
          const duration = calculateSleepDuration(log.scheduledBedTime!, log.scheduledWakeTime!)
          durationText = `(${duration.hours}h ${duration.minutes > 0 ? `${duration.minutes}m` : ""})`
          icon = <CheckCircle className="w-5 h-5 text-status-green" />
          bgColor = "bg-status-green-bg"
        } else if (log && log.status === "logged_custom") {
          statusText = `Registrado: ${formatTime(log.actualBedTime!)} - ${formatTime(log.actualWakeTime!)}`
          const duration = calculateSleepDuration(log.actualBedTime!, log.actualWakeTime!)
          durationText = `(${duration.hours}h ${duration.minutes > 0 ? `${duration.minutes}m` : ""})`
          icon = <CheckCircle className="w-5 h-5 text-status-yellow" />
          bgColor = "bg-status-yellow-bg"
        }

        return (
          <div
            key={dayName}
            className={`flex items-center justify-between p-3 rounded-lg ${bgColor} border border-border/50`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <div>
                <p className="font-medium text-foreground">{dayName}</p>
                <p className="text-xs text-muted-foreground">
                  {statusText} <span className="text-muted-foreground/80">{durationText}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditLog(index)}
              className="text-sleep-accent-blue hover:text-sleep-accent-blue/80 hover:bg-sleep-accent-blue/10"
              aria-label={`Editar registro de ${dayName}`}
            >
              <Edit3 className="w-4 h-4 mr-1" /> Editar
            </Button>
          </div>
        )
      })}
    </div>
  )
} 