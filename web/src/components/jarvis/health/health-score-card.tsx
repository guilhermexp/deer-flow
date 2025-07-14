"use client"

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Heart, Activity, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import dynamic from 'next/dynamic'

// Lazy load Chart.js para melhor performance
const LazyLineChart = dynamic(
  () => import('react-chartjs-2').then(mod => {
    // Configurar Chart.js quando importado
    import('chart.js').then(chartModule => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } = chartModule
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
    })
    return { default: mod.Line }
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse bg-muted rounded h-full w-full" />
      </div>
    )
  }
)

const timeFilters = [
  { id: "1d", label: "1 Dia" },
  { id: "1w", label: "1 Semana" },
  { id: "1m", label: "1 Mês" },
  { id: "1y", label: "1 Ano" },
]

interface HealthScoreCardProps {
  healthData: {
    currentScore: number
    weeklyScores: number[]
    trend: 'up' | 'down' | 'stable'
  }
}

export function HealthScoreCard({ healthData }: HealthScoreCardProps) {
  const [chartLoaded, setChartLoaded] = useState(false)
  const { currentScore, weeklyScores, trend } = healthData

  useEffect(() => {
    // Delay chart loading slightly to not block initial render
    const timer = setTimeout(() => setChartLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
      label: 'Pontuação de Saúde',
      data: weeklyScores,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `Pontuação: ${context.parsed.y}/100`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { display: false },
      },
      x: {
        grid: { display: false },
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Pontuação de Saúde</CardTitle>
            <CardDescription>Baseado em todos os seus indicadores</CardDescription>
          </div>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-2xl font-bold">{currentScore}/100</div>
            <div className={`flex items-center ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm ml-1">
                {trend === 'up' ? '+3%' : trend === 'down' ? '-2%' : '0%'}
              </span>
            </div>
          </div>

          {chartLoaded ? (
            <div className="h-[200px]">
              <LazyLineChart data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-pulse bg-muted rounded h-full w-full" />
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground mt-4">
            <span>Esta semana</span>
            <span>Tendência {trend === 'up' ? 'crescente' : trend === 'down' ? 'decrescente' : 'estável'}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}