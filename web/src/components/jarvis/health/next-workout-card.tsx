"use client";

import { Dumbbell, Clock, CheckCircle } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";

interface NextWorkoutCardProps {
  workout: {
    nextWorkout: {
      time: string;
      type: string;
      duration: number;
      intensity: string;
    };
    weeklyGoal: number;
    weeklyCompleted: number;
  };
  onCompleteWorkout?: () => void;
}

export function NextWorkoutCard({
  workout,
  onCompleteWorkout,
}: NextWorkoutCardProps) {
  const progress = (workout.weeklyCompleted / workout.weeklyGoal) * 100;

  // Calcula tempo restante para o próximo treino
  const getTimeUntilWorkout = () => {
    const now = new Date();
    const timeParts = workout.nextWorkout.time.split(":").map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const workoutTime = new Date();
    workoutTime.setHours(hours, minutes, 0, 0);

    // Se o horário já passou hoje, assume que é amanhã
    if (workoutTime < now) {
      workoutTime.setDate(workoutTime.getDate() + 1);
    }

    const diff = workoutTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `Em ${hoursLeft}h ${minutesLeft}min`;
    } else {
      return `Em ${minutesLeft}min`;
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border-white/10 bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-100 sm:text-base">
              Próximo Treino
            </span>
          </div>
          {onCompleteWorkout && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-400 hover:bg-white/[0.08] hover:text-blue-300"
              onClick={(e) => {
                e.stopPropagation();
                onCompleteWorkout();
              }}
              title="Marcar como concluído"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mb-3 sm:mb-4">
          <div className="text-base font-bold text-blue-400 sm:text-lg">
            {workout.nextWorkout.type}
          </div>
          <div className="text-xs text-gray-400 sm:text-sm">
            Intensidade: {workout.nextWorkout.intensity}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {workout.nextWorkout.time}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
              <Clock className="h-3 w-3" />
              <span>{getTimeUntilWorkout()}</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>Duração: {workout.nextWorkout.duration}min</div>
            <div className="text-blue-400">
              {workout.weeklyCompleted}/{workout.weeklyGoal} esta semana
            </div>
          </div>
        </div>

        {/* Progressão semanal */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-400">Progresso Semanal</span>
            <span className="font-medium text-gray-100">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
