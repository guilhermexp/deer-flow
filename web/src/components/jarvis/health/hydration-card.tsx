"use client"

import { Droplets, Plus, Droplet } from "lucide-react"
import { Card } from "~/components/ui/card"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"

interface HydrationCardProps {
  hydration: {
    current: number
    goal: number
    history: { time: string; amount: number }[]
  }
  onAddWater: (amount: number) => void
}

export function HydrationCard({ hydration, onAddWater }: HydrationCardProps) {
  const percentage = Math.round((hydration.current / hydration.goal) * 100)
  const glasses = Math.round((hydration.current / 250))
  const totalGlasses = Math.round(hydration.goal / 250)
  const filledDrops = Math.floor((hydration.current / hydration.goal) * 10)

  const handleAddWater = (amount: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddWater(amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-white/[0.02] border-white/10">
        <div className="flex justify-between items-center text-sm mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm sm:text-base text-gray-100">Hidratação</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-white/[0.08]"
            onClick={handleAddWater(250)}
            title="Adicionar 250ml"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-10 gap-1 mb-3 sm:mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
              i < filledDrops ? 'bg-blue-500' : 'bg-white/[0.05]'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-xl sm:text-2xl font-bold tracking-tight text-blue-400"
              key={hydration.current}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {hydration.current.toLocaleString()}
            </motion.span>
            <span className="text-xs sm:text-sm text-gray-400 font-medium">mL</span>
          </div>
          <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
            <Droplet className="w-3 h-3" />
            <span>{percentage}% da meta</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>Meta: {hydration.goal}mL</div>
          <div className="text-blue-400">{glasses}/{totalGlasses} copos</div>
        </div>
      </div>
      
      {/* Botões rápidos para adicionar água */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8 border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-gray-400 hover:text-gray-100"
          onClick={handleAddWater(200)}
        >
          +200ml
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8 border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-gray-400 hover:text-gray-100"
          onClick={handleAddWater(500)}
        >
          +500ml
        </Button>
      </div>
      </Card>
    </motion.div>
  )
}