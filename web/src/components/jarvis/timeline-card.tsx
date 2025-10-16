"use client"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import VerticalTimeline, { type TimelineEntry } from "~/components/jarvis/vertical-timeline" // Ensure type import
import LiquidGlassCard from "~/components/ui/liquid-glass-card"

export default function TimelineCard() {
  const timelineData: TimelineEntry[] = [
    {
      id: "1",
      time: "06:30",
      type: "wakeup",
      title: "Acordei",
      subtitle: "Início do dia produtivo",
    },
    {
      id: "2",
      time: "07:00",
      type: "workout",
      title: "Treino Matinal",
      subtitle: "Exercícios de força",
      duration: "45 min",
      calories: 320,
      workoutSets: [
        { exercise: "Flexões", sets: 3, reps: 15, totalReps: 45 },
        { exercise: "Agachamentos", sets: 3, reps: 20, totalReps: 60 },
        { exercise: "Abdominais", sets: 3, reps: 25, totalReps: 75 },
      ],
      hasDetails: true,
    },
    {
      id: "3",
      time: "08:30",
      type: "nutrition",
      title: "Café da Manhã",
      subtitle: "Refeição balanceada",
      calories: 450,
      nutritionMacros: [
        { type: "protein", amount: 25, unit: "g" },
        { type: "carbs", amount: 35, unit: "g" },
        { type: "fat", amount: 15, unit: "g" },
      ],
      hasDetails: true,
    },
    {
      id: "4",
      time: "12:00",
      type: "checkin",
      title: "Check-in Diário",
      subtitle: "Revisão das metas",
    },
    {
      id: "5",
      time: "18:00",
      type: "walk",
      title: "Caminhada",
      subtitle: "Exercício cardiovascular",
      duration: "30 min",
      calories: 180,
      hasDetails: true,
    },
  ]

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl pb-3 pt-4 px-4 relative z-10">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <motion.div
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.1 },
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          >
            <Clock className="h-4 w-4 text-gray-400" />
          </motion.div>
          Timeline
        </h3>
        <VerticalTimeline entries={timelineData} className="px-3 pb-3 sm:px-4 sm:pb-4" />
      </LiquidGlassCard>
    </motion.div>
  )
}
