"use client"

import { useState, useMemo } from "react"
import { Brain, Heart, Wind, Dumbbell, ArrowRight, Droplets, Moon, AlertCircle } from "lucide-react"
import { Card } from "~/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import type { HealthData } from "~/lib/health-data"

interface AISuggestionsCardProps {
  healthData: HealthData
}

export function AISuggestionsCard({ healthData }: AISuggestionsCardProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Gerar sugestões baseadas nos dados de saúde
  const suggestions = useMemo(() => {
    const allSuggestions = []
    
    // Sugestão de hidratação
    const hydrationPercent = (healthData.hydration.current / healthData.hydration.goal) * 100
    if (hydrationPercent < 60) {
      allSuggestions.push({
        id: 'hydration',
        value: Math.round(healthData.hydration.goal - healthData.hydration.current),
        icon: Droplets,
        label: 'ml de água',
        color: 'text-blue-400',
        bgColor: 'bg-blue-600/20',
        priority: 1,
        action: 'Beba mais água para atingir sua meta diária',
        detail: `Você bebeu ${healthData.hydration.current}ml de ${healthData.hydration.goal}ml`
      })
    }
    
    // Sugestão de sono
    if (healthData.sleep.quality < 80) {
      allSuggestions.push({
        id: 'sleep',
        value: '22:30',
        icon: Moon,
        label: 'Hora de dormir',
        color: 'text-purple-400',
        bgColor: 'bg-purple-600/20',
        priority: 2,
        action: 'Durma mais cedo para melhorar a qualidade do sono',
        detail: `Qualidade do sono atual: ${healthData.sleep.quality}%`
      })
    }
    
    // Sugestão de exercício
    const workoutPercent = (healthData.workout.weeklyCompleted / healthData.workout.weeklyGoal) * 100
    if (workoutPercent < 100) {
      allSuggestions.push({
        id: 'workout',
        value: healthData.workout.weeklyGoal - healthData.workout.weeklyCompleted,
        icon: Dumbbell,
        label: 'Treinos restantes',
        color: 'text-green-400',
        bgColor: 'bg-green-600/20',
        priority: 3,
        action: 'Complete seus treinos semanais',
        detail: `${healthData.workout.weeklyCompleted} de ${healthData.workout.weeklyGoal} concluídos`
      })
    }
    
    // Sugestão de pressão arterial
    if (healthData.bloodPressure.systolic > 130 || healthData.bloodPressure.diastolic > 85) {
      allSuggestions.push({
        id: 'pressure',
        value: '!',
        icon: AlertCircle,
        label: 'Pressão Alta',
        color: 'text-red-400',
        bgColor: 'bg-red-600/20',
        priority: 0,
        action: 'Monitore sua pressão arterial',
        detail: `${healthData.bloodPressure.systolic}/${healthData.bloodPressure.diastolic} mmHg`
      })
    }
    
    // Sugestão de bem-estar geral
    if (healthData.score < 90) {
      allSuggestions.push({
        id: 'wellbeing',
        value: healthData.score,
        icon: Heart,
        label: 'Bem-estar',
        color: 'text-rose-400',
        bgColor: 'bg-rose-600/20',
        priority: 4,
        action: 'Melhore seus hábitos para aumentar seu score',
        detail: 'Score baseado em múltiplos fatores de saúde'
      })
    }
    
    // Sugestão de respiração/meditação
    if (typeof window !== 'undefined') {
      const currentHour = new Date().getHours()
      if (currentHour >= 12 && currentHour <= 14) {
        allSuggestions.push({
          id: 'breathing',
          value: 5,
          icon: Wind,
          label: 'min respiração',
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-600/20',
          priority: 5,
          action: 'Faça uma pausa para respiração consciente',
          detail: 'Reduza o estresse do meio-dia'
        })
      }
    }
    
    // Ordenar por prioridade e pegar as 3 principais
    return allSuggestions.sort((a, b) => a.priority - b.priority)
  }, [healthData])
  
  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3)
  return (
    <Card className="p-6 h-full bg-white/[0.02] border-white/10">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="font-semibold text-lg sm:text-xl tracking-tight flex items-center gap-2 text-white">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span className="hidden sm:inline">Sugestões IA</span>
          <span className="sm:hidden">IA</span>
        </h3>
        {suggestions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-400 text-xs sm:text-sm hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">{showAll ? 'Ver Menos' : 'Ver Todas'}</span>
            <span className="sm:hidden">{showAll ? 'Menos' : 'Ver'}</span>
            <ArrowRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayedSuggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className={`bg-white/[0.05] rounded-md p-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-white/10 hover:border-white/20 hover:bg-white/[0.08]`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white/[0.05]">
                        <Icon className={`w-5 h-5 ${suggestion.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white">
                            {suggestion.value}
                          </span>
                          <span className="text-sm text-gray-400">
                            {suggestion.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {suggestion.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-100 mt-2">
                    {suggestion.action}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      
      {suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Heart className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-blue-400">Excelente!</p>
          <p className="text-sm text-gray-400 mt-1">Todos os seus indicadores estão ótimos</p>
        </motion.div>
      )}
    </Card>
  )
}