"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatTime, calculateSleepDuration } from "~/lib/jarvis/sleep-utils";
import type { SleepLogEntry } from "./sleep-dashboard";

interface LogSleepDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dayIndex: number;
  dayName: string; // Já virá traduzido do componente pai
  scheduledBedTime: number;
  scheduledWakeTime: number;
  onLogSleep: (dayIndex: number, log: SleepLogEntry) => void;
  currentLog?: SleepLogEntry | null;
}

const timeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

const minutesToTimeStr = (totalMinutes?: number): string => {
  if (totalMinutes === undefined || totalMinutes === null) return "";
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export default function LogSleepDialog({
  isOpen,
  onOpenChange,
  dayIndex,
  dayName,
  scheduledBedTime,
  scheduledWakeTime,
  onLogSleep,
  currentLog,
}: LogSleepDialogProps) {
  const [isLoggingCustom, setIsLoggingCustom] = useState(false);
  const [customBedTime, setCustomBedTime] = useState("");
  const [customWakeTime, setCustomWakeTime] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (currentLog?.status === "logged_custom") {
        setIsLoggingCustom(true);
        setCustomBedTime(
          minutesToTimeStr(currentLog.actualBedTime ?? scheduledBedTime)
        );
        setCustomWakeTime(
          minutesToTimeStr(currentLog.actualWakeTime ?? scheduledWakeTime)
        );
      } else {
        setIsLoggingCustom(false);
        setCustomBedTime(minutesToTimeStr(scheduledBedTime));
        setCustomWakeTime(minutesToTimeStr(scheduledWakeTime));
      }
    }
  }, [isOpen, currentLog, scheduledBedTime, scheduledWakeTime]);

  const scheduledDuration = calculateSleepDuration(
    scheduledBedTime,
    scheduledWakeTime
  );

  const handleConfirmScheduled = () => {
    onLogSleep(dayIndex, {
      status: "confirmed",
      scheduledBedTime,
      scheduledWakeTime,
    });
    onOpenChange(false);
  };

  const handleLogCustom = () => {
    const bedMinutes = timeToMinutes(customBedTime);
    const wakeMinutes = timeToMinutes(customWakeTime);

    if (bedMinutes === null || wakeMinutes === null) {
      alert("Por favor, insira horários válidos no formato HH:MM.");
      return;
    }
    onLogSleep(dayIndex, {
      status: "logged_custom",
      actualBedTime: bedMinutes,
      actualWakeTime: wakeMinutes,
      scheduledBedTime,
      scheduledWakeTime,
    });
    onOpenChange(false);
  };

  const handleClearLog = () => {
    onLogSleep(dayIndex, { status: "not_logged" });
    onOpenChange(false);
  };

  const resetAndClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="border-white/10 bg-[#0a0a0a] text-gray-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">
            Registrar Sono para {dayName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Registre como foi seu sono neste dia. Você pode confirmar o horário
            agendado ou inserir horários diferentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-400">
            Agendado: {formatTime(scheduledBedTime)} -{" "}
            {formatTime(scheduledWakeTime)} ({scheduledDuration?.hours || 0}h{" "}
            {(scheduledDuration?.minutes || 0) > 0
              ? `${scheduledDuration?.minutes || 0}m`
              : ""}
            )
          </p>

          {!isLoggingCustom ? (
            <div className="space-y-3">
              <Button
                onClick={handleConfirmScheduled}
                className="w-full border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Confirmar Sono Agendado
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsLoggingCustom(true)}
                className="w-full border-white/10 text-gray-300 hover:bg-white/[0.08] hover:text-gray-100"
              >
                Registrar Sono Diferente
              </Button>
              {currentLog && currentLog.status !== "not_logged" && (
                <Button
                  variant="ghost"
                  onClick={handleClearLog}
                  className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  Limpar Registro
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bedtime" className="text-gray-300">
                  Hora de Dormir Real
                </Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={customBedTime}
                  onChange={(e) => setCustomBedTime(e.target.value)}
                  className="border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
                />
              </div>
              <div>
                <Label htmlFor="waketime" className="text-gray-300">
                  Hora de Acordar Real
                </Label>
                <Input
                  id="waketime"
                  type="time"
                  value={customWakeTime}
                  onChange={(e) => setCustomWakeTime(e.target.value)}
                  className="border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
                />
              </div>
              <Button
                onClick={handleLogCustom}
                className="w-full border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Salvar Sono Personalizado
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsLoggingCustom(false)}
                className="w-full border-white/10 text-gray-300 hover:bg-white/[0.08]"
              >
                Voltar
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-gray-300 hover:bg-white/[0.08]"
            >
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
