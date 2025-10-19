"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import EventCard from "../event-card"; // EventCard é usado aqui
import type { CalendarEvent } from "../../lib/types";

interface DayViewEventAreaProps {
  relevantHours: number[];
  eventsForSelectedDay: CalendarEvent[];
  isCurrentEventActive: (event: CalendarEvent) => boolean;
  onDeleteEvent: (event: CalendarEvent) => void;
}

export default function DayViewEventArea({
  relevantHours,
  eventsForSelectedDay,
  isCurrentEventActive,
  onDeleteEvent,
}: DayViewEventAreaProps) {
  return (
    <div className="relative">
      {/* Linhas da grade horária */}
      {relevantHours.map((hour) => (
        <div
          key={hour}
          className="border-border/20 h-[120px] border-b last:border-b-0"
        />
      ))}
      <div className="absolute inset-0 space-y-2">
        <AnimatePresence>
          {eventsForSelectedDay.map((event, eventIndex) => {
            const eventHourIndex = relevantHours.indexOf(event.startHour);
            if (eventHourIndex === -1) return null;
            // O +2 é um pequeno ajuste para alinhar o topo do card com a marcação da hora
            const topPosition = eventHourIndex * 120 + 2;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: eventIndex * 0.1 }}
                className="absolute right-0 left-0"
                style={{
                  top: `${topPosition}px`,
                  height: `${event.duration * 120 - 4}px`,
                }}
              >
                <EventCard
                  event={event}
                  isCurrent={isCurrentEventActive(event)}
                  view="day"
                  onDelete={onDeleteEvent}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {eventsForSelectedDay.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full flex-col items-center justify-center py-12 text-center"
          >
            <div className="bg-card/50 border-border mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
              <Clock className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-muted-foreground mb-2 text-lg font-medium">
              Nenhum evento agendado
            </h3>
            <p className="text-muted-foreground/70 text-sm">
              Seu dia está livre
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
