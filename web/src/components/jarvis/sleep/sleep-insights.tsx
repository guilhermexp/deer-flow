"use client"

import type { SleepLogEntry } from "./sleep-dashboard"
import { calculateSleepDuration, formatDuration, FULL_DAY_NAMES_PT } from "~/lib/jarvis/sleep-utils" // Usando nomes completos em Português
import { BarChart, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react"

interface SleepInsightsProps {
  sleepLog: SleepLogEntry[]
  sleepGoalHours: number
}

export default function SleepInsights({ sleepLog, sleepGoalHours }: SleepInsightsProps) {
  const loggedDays = sleepLog.filter((log) => log && (log.status === "confirmed" || log.status === "logged_custom"))
  const sleepGoalMinutes = sleepGoalHours * 60

  let totalSleepMinutes = 0
  let daysGoalMet = 0
  const dailyDurations: { day: string; durationMinutes: number; metGoal: boolean }[] = []

  sleepLog.forEach((log, index) => {
    if (log && (log.status === "confirmed" || log.status === "logged_custom")) {
      let bedTime, wakeTime
      if (log.status === "confirmed") {
        bedTime = log.scheduledBedTime!
        wakeTime = log.scheduledWakeTime!
      } else {
        bedTime = log.actualBedTime!
        wakeTime = log.actualWakeTime!
      }
      const duration = calculateSleepDuration(bedTime, wakeTime)
      totalSleepMinutes += duration.totalMinutes
      const metGoal = duration.totalMinutes >= sleepGoalMinutes
      if (metGoal) {
        daysGoalMet++
      }
      dailyDurations.push({ day: FULL_DAY_NAMES_PT[index] ?? '', durationMinutes: duration.totalMinutes, metGoal })
    } else {
      dailyDurations.push({ day: FULL_DAY_NAMES_PT[index] ?? '', durationMinutes: -1, metGoal: false })
    }
  })

  const averageSleepMinutes = loggedDays.length > 0 ? totalSleepMinutes / loggedDays.length : 0

  const insights = [
    "Busque horários consistentes para dormir e acordar, mesmo nos fins de semana, para regular seu relógio biológico.",
    "Garanta que seu quarto seja escuro, silencioso e fresco para um sono ideal.",
    "Evite refeições pesadas, cafeína e álcool perto da hora de dormir.",
  ]
  if (loggedDays.length > 3 && averageSleepMinutes < sleepGoalMinutes - 60) {
    insights.unshift(
      "Sua média de sono está mais de uma hora abaixo da sua meta. Priorizar um horário de dormir mais cedo pode ajudar.",
    )
  }
  if (daysGoalMet / (loggedDays.length || 1) < 0.5 && loggedDays.length > 2) {
    insights.push(
      "Você está atingindo sua meta de sono menos da metade das vezes. Tente identificar obstáculos nos dias em que não atinge.",
    )
  } else {
    insights.push(
      "Se você consistentemente não atinge sua meta de sono, considere ajustar sua rotina ou consultar um profissional.",
    )
  }

  return (
    <div className="space-y-6 p-2 text-foreground">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
          <BarChart className="w-5 h-5" /> Métricas Semanais de Sono
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted p-3 rounded-lg border border-border">
            <p className="text-muted-foreground">Média Diária de Sono</p>
            <p className="text-xl font-semibold text-foreground">{formatDuration(averageSleepMinutes)}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg border border-border">
            <p className="text-muted-foreground">Sono Semanal Total</p>
            <p className="text-xl font-semibold text-foreground">{formatDuration(totalSleepMinutes)}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg border border-border">
            <p className="text-muted-foreground">Dias Registrados</p>
            <p className="text-xl font-semibold text-foreground">{loggedDays.length} / 7</p>
          </div>
          <div className="bg-muted p-3 rounded-lg border border-border">
            <p className="text-muted-foreground">Dias Meta Cumprida</p>
            <p className="text-xl font-semibold text-foreground">
              {daysGoalMet} / {loggedDays.length || 0}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
          <TrendingUp className="w-5 h-5" /> Detalhamento Diário
        </h3>
        <div className="space-y-2">
          {dailyDurations.map(({ day, durationMinutes, metGoal }) => (
            <div
              key={day}
              className={`flex justify-between items-center p-2.5 rounded-md border ${durationMinutes === -1 ? "bg-muted border-border" : metGoal ? "bg-status-green-bg border-status-green/30" : "bg-status-red-bg border-status-red/30"}`}
            >
              <span className="font-medium text-foreground">{day}</span>
              <span
                className={`${durationMinutes === -1 ? "text-muted-foreground" : metGoal ? "text-status-green" : "text-status-red"}`}
              >
                {durationMinutes === -1 ? "Não Registrado" : formatDuration(durationMinutes, true)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
          <Lightbulb className="w-5 h-5" /> Sugestões (IA)
        </h3>
        <div className="bg-muted p-4 rounded-lg border border-border space-y-2 text-sm">
          {insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-muted-foreground">
              - {insight}
            </p>
          ))}
          <div className="pt-2 text-xs text-muted-foreground/80 border-t border-border/50 mt-3">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Estas são sugestões gerais. Para insights personalizados da IA, seria necessário conectar a um serviço de
            backend.
          </div>
        </div>
      </div>
    </div>
  )
} 