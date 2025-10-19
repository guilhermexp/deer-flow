"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DayViewTimeColumnProps {
  relevantHours: number[];
  formatHourForDisplay: (hour: number) => string;
  currentTimePosition: number | null; // Já é o valor em pixels correto
}

export default function DayViewTimeColumn({
  relevantHours,
  formatHourForDisplay,
  currentTimePosition,
}: DayViewTimeColumnProps) {
  return (
    <div className="relative">
      {/* Linha vertical central da timeline */}
      <div className="bg-border/30 absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 transform" />
      {relevantHours.map((hour) => (
        <div
          key={hour}
          className="relative flex h-[120px] items-start justify-center pt-2"
        >
          <time
            className="text-muted-foreground bg-card/80 border-border/50 rounded-md border px-2 py-1 text-xs font-medium backdrop-blur-sm"
            dateTime={`${hour.toString().padStart(2, "0")}:00`}
          >
            {formatHourForDisplay(hour)}
          </time>
          {/* Bolinha na linha do tempo para cada hora */}
          <div className="bg-muted-foreground/50 border-border absolute top-2 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full border" />
        </div>
      ))}
      <AnimatePresence>
        {currentTimePosition !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 z-10 -translate-x-1/2 transform"
            style={{ top: `${currentTimePosition + 2}px` }} // +2 para ajuste visual da bolinha
          >
            <div className="flex items-center">
              <div className="bg-destructive border-destructive/70 shadow-destructive/50 h-3 w-3 rounded-full border-2 shadow-lg" />
              <div className="bg-destructive text-destructive-foreground ml-2 rounded-md px-2 py-1 text-xs font-medium shadow-lg">
                Agora
              </div>
            </div>
            {/* Linha horizontal do indicador "Agora" que se estende para a área de eventos */}
            {/* Ajuste o 'w-' conforme necessário para o seu layout. Pode precisar de `calc` ou ser passado como prop. */}
            <div className="bg-destructive/60 absolute top-1/2 left-6 h-px w-[calc(100vw_-_120px_-_theme(spacing.8)_-_theme(spacing.8)_-_2px)] -translate-y-1/2 transform sm:w-[calc(100vw_-_120px_-_theme(spacing.16)_-_theme(spacing.8)_-_2px)] md:w-[calc(100vw_-_120px_-_theme(spacing.24)_-_theme(spacing.8)_-_2px)] lg:w-[calc(100vw_-_120px_-_theme(spacing.32)_-_theme(spacing.8)_-_2px)] xl:w-[calc(100vw_-_120px_-_theme(spacing.48)_-_theme(spacing.8)_-_2px)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
