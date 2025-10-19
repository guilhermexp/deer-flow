"use client";

import type { SleepLogEntry } from "./sleep-dashboard";
import {
  calculateSleepDuration,
  formatDuration,
  FULL_DAY_NAMES_PT,
} from "~/lib/jarvis/sleep-utils"; // Usando nomes completos em Português
import { BarChart, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";

interface SleepInsightsProps {
  sleepLog: SleepLogEntry[];
  sleepGoalHours: number;
}

export default function SleepInsights({
  sleepLog,
  sleepGoalHours,
}: SleepInsightsProps) {
  const loggedDays = sleepLog.filter(
    (log) =>
      log && (log.status === "confirmed" || log.status === "logged_custom")
  );
  const sleepGoalMinutes = sleepGoalHours * 60;

  let totalSleepMinutes = 0;
  let daysGoalMet = 0;
  const dailyDurations: {
    day: string;
    durationMinutes: number;
    metGoal: boolean;
  }[] = [];

  sleepLog.forEach((log, index) => {
    if (log && (log.status === "confirmed" || log.status === "logged_custom")) {
      let bedTime, wakeTime;
      if (log.status === "confirmed") {
        bedTime = log.scheduledBedTime!;
        wakeTime = log.scheduledWakeTime!;
      } else {
        bedTime = log.actualBedTime!;
        wakeTime = log.actualWakeTime!;
      }
      const duration = calculateSleepDuration(bedTime, wakeTime);
      totalSleepMinutes += duration.totalMinutes;
      const metGoal = duration.totalMinutes >= sleepGoalMinutes;
      if (metGoal) {
        daysGoalMet++;
      }
      dailyDurations.push({
        day: FULL_DAY_NAMES_PT[index] ?? "",
        durationMinutes: duration.totalMinutes,
        metGoal,
      });
    } else {
      dailyDurations.push({
        day: FULL_DAY_NAMES_PT[index] ?? "",
        durationMinutes: -1,
        metGoal: false,
      });
    }
  });

  const averageSleepMinutes =
    loggedDays.length > 0 ? totalSleepMinutes / loggedDays.length : 0;

  const insights = [
    "Busque horários consistentes para dormir e acordar, mesmo nos fins de semana, para regular seu relógio biológico.",
    "Garanta que seu quarto seja escuro, silencioso e fresco para um sono ideal.",
    "Evite refeições pesadas, cafeína e álcool perto da hora de dormir.",
  ];
  if (loggedDays.length > 3 && averageSleepMinutes < sleepGoalMinutes - 60) {
    insights.unshift(
      "Sua média de sono está mais de uma hora abaixo da sua meta. Priorizar um horário de dormir mais cedo pode ajudar."
    );
  }
  if (daysGoalMet / (loggedDays.length || 1) < 0.5 && loggedDays.length > 2) {
    insights.push(
      "Você está atingindo sua meta de sono menos da metade das vezes. Tente identificar obstáculos nos dias em que não atinge."
    );
  } else {
    insights.push(
      "Se você consistentemente não atinge sua meta de sono, considere ajustar sua rotina ou consultar um profissional."
    );
  }

  return (
    <div className="text-foreground space-y-6 p-2">
      <div>
        <h3 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
          <BarChart className="h-5 w-5" /> Métricas Semanais de Sono
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted border-border rounded-lg border p-3">
            <p className="text-muted-foreground">Média Diária de Sono</p>
            <p className="text-foreground text-xl font-semibold">
              {formatDuration(averageSleepMinutes)}
            </p>
          </div>
          <div className="bg-muted border-border rounded-lg border p-3">
            <p className="text-muted-foreground">Sono Semanal Total</p>
            <p className="text-foreground text-xl font-semibold">
              {formatDuration(totalSleepMinutes)}
            </p>
          </div>
          <div className="bg-muted border-border rounded-lg border p-3">
            <p className="text-muted-foreground">Dias Registrados</p>
            <p className="text-foreground text-xl font-semibold">
              {loggedDays.length} / 7
            </p>
          </div>
          <div className="bg-muted border-border rounded-lg border p-3">
            <p className="text-muted-foreground">Dias Meta Cumprida</p>
            <p className="text-foreground text-xl font-semibold">
              {daysGoalMet} / {loggedDays.length || 0}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5" /> Detalhamento Diário
        </h3>
        <div className="space-y-2">
          {dailyDurations.map(({ day, durationMinutes, metGoal }) => (
            <div
              key={day}
              className={`flex items-center justify-between rounded-md border p-2.5 ${durationMinutes === -1 ? "bg-muted border-border" : metGoal ? "bg-status-green-bg border-status-green/30" : "bg-status-red-bg border-status-red/30"}`}
            >
              <span className="text-foreground font-medium">{day}</span>
              <span
                className={`${durationMinutes === -1 ? "text-muted-foreground" : metGoal ? "text-status-green" : "text-status-red"}`}
              >
                {durationMinutes === -1
                  ? "Não Registrado"
                  : formatDuration(durationMinutes, true)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="h-5 w-5" /> Sugestões (IA)
        </h3>
        <div className="bg-muted border-border space-y-2 rounded-lg border p-4 text-sm">
          {insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-muted-foreground">
              - {insight}
            </p>
          ))}
          <div className="text-muted-foreground/80 border-border/50 mt-3 border-t pt-2 text-xs">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            Estas são sugestões gerais. Para insights personalizados da IA,
            seria necessário conectar a um serviço de backend.
          </div>
        </div>
      </div>
    </div>
  );
}
