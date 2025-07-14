"use client"

import { Activity, ChevronRight, Heart } from "lucide-react"
import { Card } from "~/components/ui/card"
import { motion } from "framer-motion"
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface BloodPressureCardProps {
  bloodPressure: {
    systolic: number
    diastolic: number
    pulse: number
    history: { date: string; systolic: number; diastolic: number }[]
  }
}

export function BloodPressureCard({ bloodPressure }: BloodPressureCardProps) {
  // Determina o status da pressão
  const getPressureStatus = () => {
    const { systolic, diastolic } = bloodPressure
    // Mantendo cores semânticas por enquanto, pois o guia não especifica cores de status.
    // Idealmente, seriam mapeadas para variáveis como --success, --warning, --error.
    if (systolic < 120 && diastolic < 80) return { text: "Normal", color: "text-green-400" }
    if (systolic < 130 && diastolic < 80) return { text: "Elevada", color: "text-yellow-400" }
    if (systolic < 140 || diastolic < 90) return { text: "Alta 1", color: "text-orange-400" }
    return { text: "Alta 2", color: "text-red-400" }
  }
  
  const status = getPressureStatus()

  // Prepara dados do histórico para o gráfico
  const recentHistory = bloodPressure.history.slice(0, 4).reverse()
  const chartData = {
    labels: recentHistory.map((_, i) => `${8 + i * 4}:00`),
    datasets: [{
      data: recentHistory.map(h => h.systolic),
      borderColor: 'hsl(var(--chart-2))', // Usando variável de gráfico
      backgroundColor: 'hsla(var(--chart-2), 0.1)', // Usando variável de gráfico com alfa
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: TooltipItem<"line">) => `${context.parsed.y} mmHg`
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false, color: 'hsla(var(--border), 0.1)' },
        ticks: { color: 'rgba(156, 163, 175, 1)', font: { size: 9 } }
      },
      y: {
        display: false,
        min: 110,
        max: 130
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="p-6 bg-white/[0.02] border-white/10">
      <div className="flex justify-between items-center text-sm mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-destructive" />
          <span className="font-medium text-sm sm:text-base text-gray-100">Pressão Arterial</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="mb-3 sm:mb-4 h-16 sm:h-20">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-xl sm:text-2xl font-bold tracking-tight text-blue-400"
              key={`${bloodPressure.systolic}/${bloodPressure.diastolic}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {bloodPressure.systolic}/{bloodPressure.diastolic}
            </motion.span>
            <span className="text-xs sm:text-sm text-gray-400 font-medium">mmHg</span>
          </div>
          <div className={`text-xs ${status.color} flex items-center gap-1 mt-1`}>
            <Heart className="w-3 h-3" />
            <span>{status.text}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>Pulso: {bloodPressure.pulse} bpm</div>
          <div className={status.color}>Estável</div>
        </div>
      </div>
    </Card>
    </motion.div>
  )
}