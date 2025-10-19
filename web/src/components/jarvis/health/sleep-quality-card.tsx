"use client";

import { Moon, ChevronRight } from "lucide-react";
import { Card } from "~/components/ui/card";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SleepQualityCardProps {
  sleep: {
    duration: number;
    quality: number;
    bedTime: string;
    wakeTime: string;
    phases: {
      deep: number;
      light: number;
      rem: number;
      awake: number;
    };
  };
}

export function SleepQualityCard({ sleep }: SleepQualityCardProps) {
  const goal = 8;
  const percentage = Math.round((sleep.duration / goal) * 100);

  // Determina a qualidade do sono baseado no score
  const getSleepQualityText = () => {
    if (sleep.quality >= 80)
      return { text: "Ótima qualidade", color: "text-green-400" };
    if (sleep.quality >= 60)
      return { text: "Boa qualidade", color: "text-yellow-400" };
    return { text: "Qualidade baixa", color: "text-red-400" };
  };

  const qualityInfo = getSleepQualityText();

  // Mock de dados históricos (em produção viria do backend)
  const mockHistory = [6.5, 7, 7.5, 6.8, 8, 7.2, sleep.duration];

  const chartData = {
    labels: ["S", "T", "Q", "Q", "S", "S", "D"],
    datasets: [
      {
        data: mockHistory,
        backgroundColor: "hsl(var(--chart-3))",
        borderRadius: 4,
        barThickness: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "hsl(var(--popover))", // Usar cor do popover do tema
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        titleColor: "hsl(var(--popover-foreground))",
        bodyColor: "hsl(var(--popover-foreground))",
        callbacks: {
          label: (context: TooltipItem<"bar">) =>
            `${context.parsed.y}h de sono`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false, color: "hsla(var(--border), 0.1)" },
        ticks: { color: "rgba(156, 163, 175, 1)", font: { size: 10 } },
      },
      y: {
        display: false,
        min: 0,
        max: 10,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-white/10 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center justify-between text-sm sm:mb-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-100 sm:text-base">
              Qualidade do Sono
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>

        <div className="mb-3 h-16 sm:mb-4 sm:h-20">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                className="text-xl font-bold tracking-tight text-blue-400 sm:text-2xl"
                key={sleep.duration}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {sleep.duration}
              </motion.span>
              <span className="text-xs font-medium text-gray-400 sm:text-sm">
                h
              </span>
            </div>
            <div
              className={`text-xs ${qualityInfo.color} mt-1 flex items-center gap-1`}
            >
              <Moon className="h-3 w-3" />
              <span>{qualityInfo.text}</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>Meta: {goal}h</div>
            <div className="text-blue-400">{percentage}% atingido</div>
            <div className="mt-1 text-[10px] text-gray-400">
              {sleep.bedTime} - {sleep.wakeTime}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
