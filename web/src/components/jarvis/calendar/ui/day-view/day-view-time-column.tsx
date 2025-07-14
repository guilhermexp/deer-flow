"use client"

import { motion, AnimatePresence } from "framer-motion"

interface DayViewTimeColumnProps {
  relevantHours: number[]
  formatHourForDisplay: (hour: number) => string
  currentTimePosition: number | null // Já é o valor em pixels correto
}

export default function DayViewTimeColumn({
  relevantHours,
  formatHourForDisplay,
  currentTimePosition,
}: DayViewTimeColumnProps) {
  return (
    <div className="relative">
      {/* Linha vertical central da timeline */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30 transform -translate-x-1/2" />
      {relevantHours.map((hour) => (
        <div key={hour} className="relative h-[120px] flex items-start justify-center pt-2">
          <time
            className="text-xs font-medium text-muted-foreground bg-card/80 px-2 py-1 rounded-md border border-border/50 backdrop-blur-sm"
            dateTime={`${hour.toString().padStart(2, "0")}:00`}
          >
            {formatHourForDisplay(hour)}
          </time>
          {/* Bolinha na linha do tempo para cada hora */}
          <div className="absolute left-1/2 top-2 w-2 h-2 bg-muted-foreground/50 rounded-full transform -translate-x-1/2 border border-border" />
        </div>
      ))}
      <AnimatePresence>
        {currentTimePosition !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 transform -translate-x-1/2 z-10"
            style={{ top: `${currentTimePosition + 2}px` }} // +2 para ajuste visual da bolinha
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-destructive rounded-full border-2 border-destructive/70 shadow-lg shadow-destructive/50" />
              <div className="ml-2 bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1 rounded-md shadow-lg">
                Agora
              </div>
            </div>
            {/* Linha horizontal do indicador "Agora" que se estende para a área de eventos */}
            {/* Ajuste o 'w-' conforme necessário para o seu layout. Pode precisar de `calc` ou ser passado como prop. */}
            <div className="absolute top-1/2 left-6 w-[calc(100vw_-_120px_-_theme(spacing.8)_-_theme(spacing.8)_-_2px)] sm:w-[calc(100vw_-_120px_-_theme(spacing.16)_-_theme(spacing.8)_-_2px)] md:w-[calc(100vw_-_120px_-_theme(spacing.24)_-_theme(spacing.8)_-_2px)] lg:w-[calc(100vw_-_120px_-_theme(spacing.32)_-_theme(spacing.8)_-_2px)] xl:w-[calc(100vw_-_120px_-_theme(spacing.48)_-_theme(spacing.8)_-_2px)] h-px bg-destructive/60 transform -translate-y-1/2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
