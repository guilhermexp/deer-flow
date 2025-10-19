"use client";

import { Droplets, Plus, Droplet } from "lucide-react";
import { Card } from "~/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";

interface HydrationCardProps {
  hydration: {
    current: number;
    goal: number;
    history: { time: string; amount: number }[];
  };
  onAddWater: (amount: number) => void;
}

export function HydrationCard({ hydration, onAddWater }: HydrationCardProps) {
  const percentage = Math.round((hydration.current / hydration.goal) * 100);
  const glasses = Math.round(hydration.current / 250);
  const totalGlasses = Math.round(hydration.goal / 250);
  const filledDrops = Math.floor((hydration.current / hydration.goal) * 10);

  const handleAddWater = (amount: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddWater(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-white/10 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center justify-between text-sm sm:mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-100 sm:text-base">
              Hidratação
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-400 hover:bg-white/[0.08] hover:text-blue-300"
              onClick={handleAddWater(250)}
              title="Adicionar 250ml"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-10 gap-1 sm:mb-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 sm:h-3 ${
                i < filledDrops ? "bg-blue-500" : "bg-white/[0.05]"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            />
          ))}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                className="text-xl font-bold tracking-tight text-blue-400 sm:text-2xl"
                key={hydration.current}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {hydration.current.toLocaleString()}
              </motion.span>
              <span className="text-xs font-medium text-gray-400 sm:text-sm">
                mL
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
              <Droplet className="h-3 w-3" />
              <span>{percentage}% da meta</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>Meta: {hydration.goal}mL</div>
            <div className="text-blue-400">
              {glasses}/{totalGlasses} copos
            </div>
          </div>
        </div>

        {/* Botões rápidos para adicionar água */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 border-white/10 text-xs text-gray-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-100"
            onClick={handleAddWater(200)}
          >
            +200ml
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 border-white/10 text-xs text-gray-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-100"
            onClick={handleAddWater(500)}
          >
            +500ml
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
