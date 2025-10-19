"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import SleepClock from "./sleep-clock";
import LogSleepDialog from "./log-sleep-dialog";
import SleepHistory from "./sleep-history";
import SleepInsights from "./sleep-insights";
import {
  formatTime,
  calculateSleepDuration,
  DAY_NAMES_ABBR, // Usando nomes abreviados em Português
  FULL_DAY_NAMES_PT, // Usando nomes completos em Português
} from "~/lib/jarvis/sleep-utils";
import {
  CalendarDays,
  Moon,
  Bed,
  Sunrise,
  History,
  CheckCircle,
  Edit2,
  BarChart3,
  X,
} from "lucide-react";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";

const SLEEP_GOAL_HOURS = 8; // Meta de horas de sono

export interface SleepLogEntry {
  status: "not_logged" | "confirmed" | "logged_custom";
  scheduledBedTime?: number;
  scheduledWakeTime?: number;
  actualBedTime?: number;
  actualWakeTime?: number;
}

export default function SleepDashboard() {
  const [bedTimeInMinutes, setBedTimeInMinutes] = useState(22 * 60); // 22:00
  const [wakeTimeInMinutes, setWakeTimeInMinutes] = useState(6 * 60); // 06:00

  const initialLog: SleepLogEntry[] = Array(7).fill({ status: "not_logged" });
  const [sleepLog, setSleepLog] = useState<SleepLogEntry[]>(initialLog);

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"clock" | "history" | "insights">(
    "clock"
  );

  const handleOpenLogDialog = (index: number) => {
    setSelectedDayIndex(index);
    setIsLogDialogOpen(true);
  };

  const handleLogSleep = (dayIndex: number, logEntry: SleepLogEntry) => {
    setSleepLog((prevLog) => {
      const newLog = [...prevLog];
      newLog[dayIndex] = logEntry;
      return newLog;
    });
  };

  const sleepDurationInfo = useMemo(() => {
    return calculateSleepDuration(bedTimeInMinutes, wakeTimeInMinutes);
  }, [bedTimeInMinutes, wakeTimeInMinutes]);

  const sleepGoalPercentage = useMemo(() => {
    const goalMinutes = SLEEP_GOAL_HOURS * 60;
    return Math.min((sleepDurationInfo.totalMinutes / goalMinutes) * 100, 100);
  }, [sleepDurationInfo.totalMinutes]);

  const handleViewChange = (targetView: "clock" | "history" | "insights") => {
    if (viewMode === targetView && targetView !== "clock") {
      // Permite fechar history/insights, mas não o clock
      setViewMode("clock");
    } else {
      setViewMode(targetView);
    }
  };

  const getSectionTitleAndIcon = (): {
    icon: React.ReactNode;
    title: string;
  } => {
    if (viewMode === "clock")
      return {
        icon: <Moon className="h-4 w-4" />,
        title: "Hora de Dormir e Acordar",
      };
    if (viewMode === "history")
      return {
        icon: <History className="h-4 w-4" />,
        title: "Histórico de Sono",
      };
    return {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Métricas e Insights",
    };
  };
  const currentSectionInfo = getSectionTitleAndIcon();

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl px-5 pt-5 pb-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-3 text-xl font-semibold text-white">
            <motion.div
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="group"
            >
              <CalendarDays className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-400" />
            </motion.div>
            Registro Diário de Sono
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between gap-1">
              {DAY_NAMES_ABBR.map((dayAbbr, index) => {
                const log = sleepLog[index];
                let buttonClass =
                  "bg-dark-bg-secondary text-medium-text hover:bg-subtle-border border-subtle-border";
                let IconComponent: React.ReactNode = dayAbbr;

                if (log?.status === "confirmed") {
                  buttonClass =
                    "bg-status-green-bg text-status-green border-status-green/50 hover:bg-status-green-bg/80";
                  IconComponent = <CheckCircle className="h-5 w-5" />;
                } else if (log?.status === "logged_custom") {
                  buttonClass =
                    "bg-status-yellow-bg text-status-yellow border-status-yellow/50 hover:bg-status-yellow-bg/80";
                  IconComponent = <Edit2 className="h-4 w-4" />;
                }

                return (
                  <Button
                    key={dayAbbr + index}
                    variant="outline"
                    size="icon"
                    className={`focus:ring-sleep-accent-blue relative z-20 h-9 w-9 rounded-md text-xs font-medium transition-all duration-300 hover:scale-105 focus:ring-2 ${buttonClass}`}
                    onClick={() => handleOpenLogDialog(index)}
                    aria-label={`Registrar sono para ${FULL_DAY_NAMES_PT[index]}`}
                  >
                    {IconComponent}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="border-border/40 my-3 border-t"></div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-lg font-medium tracking-tight text-white">
                {currentSectionInfo.icon}
                {currentSectionInfo.title}
              </h3>
              <div className="flex items-center gap-1">
                {viewMode !== "clock" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("clock")}
                    className={`text-gray-400 hover:bg-white/[0.08] hover:text-gray-100`}
                    aria-label="Voltar para o Relógio"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewChange("history")}
                  className={`relative z-20 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100 ${viewMode === "history" ? "bg-white/[0.08] text-blue-400" : ""}`}
                  aria-label="Ver histórico de sono"
                  disabled={viewMode === "history"}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewChange("insights")}
                  className={`relative z-20 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100 ${viewMode === "insights" ? "bg-white/[0.08] text-blue-400" : ""}`}
                  aria-label="Ver métricas e insights"
                  disabled={viewMode === "insights"}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {viewMode === "clock" && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium tracking-wider text-gray-400 uppercase">
                      <Bed className="h-3.5 w-3.5" />
                      Dormir
                    </div>
                    <div className="text-2xl font-semibold text-gray-100 transition-all duration-300">
                      {formatTime(bedTimeInMinutes)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium tracking-wider text-gray-400 uppercase">
                      <Sunrise className="h-3.5 w-3.5" />
                      Acordar
                    </div>
                    <div className="text-2xl font-semibold text-gray-100 transition-all duration-300">
                      {formatTime(wakeTimeInMinutes)}
                    </div>
                  </div>
                </div>
                <SleepClock
                  bedTimeInMinutes={bedTimeInMinutes}
                  wakeTimeInMinutes={wakeTimeInMinutes}
                  onBedTimeChange={setBedTimeInMinutes}
                  onWakeTimeChange={setWakeTimeInMinutes}
                />
                <div className="mt-4 text-center">
                  <div className="mb-0.5 text-xl font-semibold text-gray-100 transition-all duration-300">
                    {sleepDurationInfo.hours}h{" "}
                    {sleepDurationInfo.minutes > 0
                      ? `${sleepDurationInfo.minutes}m`
                      : ""}
                  </div>
                  <div className="mb-2 text-sm text-gray-400">
                    {sleepGoalPercentage === 100
                      ? `Este horário cumpre sua meta de ${SLEEP_GOAL_HOURS}h de sono`
                      : `Visando ${SLEEP_GOAL_HOURS}h de sono`}
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div
                      className="bg-sleep-accent-blue h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${sleepGoalPercentage}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {viewMode === "history" && (
              <SleepHistory
                sleepLog={sleepLog}
                onEditLog={handleOpenLogDialog}
              />
            )}
            {viewMode === "insights" && (
              <SleepInsights
                sleepLog={sleepLog}
                sleepGoalHours={SLEEP_GOAL_HOURS}
              />
            )}
          </div>
        </div>
      </LiquidGlassCard>

      {selectedDayIndex !== null && (
        <LogSleepDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          dayIndex={selectedDayIndex}
          dayName={FULL_DAY_NAMES_PT[selectedDayIndex] ?? ""} // Usando nomes completos em Português
          scheduledBedTime={bedTimeInMinutes}
          scheduledWakeTime={wakeTimeInMinutes}
          onLogSleep={handleLogSleep}
          currentLog={sleepLog[selectedDayIndex]}
        />
      )}
    </motion.div>
  );
}
