"use client"

import { Dumbbell, Clock, CheckCircle } from "lucide-react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { motion } from "framer-motion"

interface NextWorkoutCardProps {
  workout: {
    nextWorkout: {
      time: string
      type: string
      duration: number
      intensity: string
    }
    weeklyGoal: number
    weeklyCompleted: number
  }
  onCompleteWorkout?: () => void
}

export function NextWorkoutCard({ workout, onCompleteWorkout }: NextWorkoutCardProps) {
  const progress = (workout.weeklyCompleted / workout.weeklyGoal) * 100
  
  // Calcula tempo restante para o próximo treino
  const getTimeUntilWorkout = () => {
    const now = new Date()
    const timeParts = workout.nextWorkout.time.split(':').map(Number)
    const hours = timeParts[0] ?? 0
    const minutes = timeParts[1] ?? 0
    const workoutTime = new Date()
    workoutTime.setHours(hours, minutes, 0, 0)
    
    // Se o horário já passou hoje, assume que é amanhã
    if (workoutTime < now) {
      workoutTime.setDate(workoutTime.getDate() + 1)
    }
    
    const diff = workoutTime.getTime() - now.getTime()
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hoursLeft > 0) {
      return `Em ${hoursLeft}h ${minutesLeft}min`
    } else {
      return `Em ${minutesLeft}min`
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="p-6 bg-white/[0.02] border-white/10">
        <div className="flex justify-between items-center text-sm mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm sm:text-base text-gray-100">Próximo Treino</span>
        </div>
        {onCompleteWorkout && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-white/[0.08]"
            onClick={(e) => {
              e.stopPropagation()
              onCompleteWorkout()
            }}
            title="Marcar como concluído"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="mb-3 sm:mb-4">
        <div className="text-base sm:text-lg font-bold text-blue-400">{workout.nextWorkout.type}</div>
        <div className="text-xs sm:text-sm text-gray-400">Intensidade: {workout.nextWorkout.intensity}</div>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">{workout.nextWorkout.time}</span>
          </div>
          <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            <span>{getTimeUntilWorkout()}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>Duração: {workout.nextWorkout.duration}min</div>
          <div className="text-blue-400">{workout.weeklyCompleted}/{workout.weeklyGoal} esta semana</div>
        </div>
      </div>
      
      {/* Progressão semanal */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-gray-400">Progresso Semanal</span>
          <span className="font-medium text-gray-100">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
      </Card>
    </motion.div>
  )
}