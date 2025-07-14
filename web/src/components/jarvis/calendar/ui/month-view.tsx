"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "~/lib/utils"
import EventCard from "./event-card" // Certifique-se que EventCard está correto
import type { CalendarEvent } from "../lib/types"
import { DAYS_OF_WEEK_ABBREVIATED } from "../lib/constants"

interface MonthViewProps {
  monthDisplayDate: Date
  getDaysInMonth: (date: Date) => (Date | null)[]
  getEventsForSpecificDate: (date: Date) => CalendarEvent[]
  isCurrentEventActive: (event: CalendarEvent) => boolean
  isDateToday: (date: Date | null) => boolean
  onNavigate: (direction: "next" | "prev") => void
  onDeleteEvent: (event: CalendarEvent) => void
  onAddEventClick?: (date: Date) => void
}

export default function MonthView({
  monthDisplayDate,
  getDaysInMonth,
  getEventsForSpecificDate,
  isCurrentEventActive,
  isDateToday,
  onNavigate,
  onDeleteEvent,
  onAddEventClick,
}: MonthViewProps) {
  // Suppress unused variable warning - feature not implemented yet
  void onAddEventClick;
  void onNavigate;
  
  const cellBackgroundStyle = "bg-white/[0.05] backdrop-blur-md"
  const emptyCellBackgroundStyle = "bg-white/[0.02] backdrop-blur-md" // Usando opacidade menor para células vazias

  return (
    <section className="space-y-6 p-1 sm:p-0 mt-2" aria-label="Month view calendar">
      <div className="rounded-lg border border-white/10 p-0.5">
        <div className="grid grid-cols-7 gap-px bg-white/10 rounded-t-md overflow-hidden">
          {DAYS_OF_WEEK_ABBREVIATED.map((day) => (
            <div key={day} className="bg-[#0a0a0a]/80 p-2 sm:p-3 text-center">
              <span className="text-xs sm:text-sm font-medium text-gray-400">
                {day}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-white/10 rounded-b-md overflow-hidden">
          {getDaysInMonth(monthDisplayDate).map((date, index) => {
            const dayEvents = date ? getEventsForSpecificDate(date) : []
            const isCurrentDay = date ? isDateToday(date) : false
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-1.5 md:p-2 transition-colors", // Ajustado padding e min-height
                  date ? cellBackgroundStyle : emptyCellBackgroundStyle,
                  date && "hover:bg-white/[0.08]",
                  isCurrentDay && "border border-blue-500/50 relative",
                )}
              >
                {isCurrentDay && (
                  <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full" />
                )}
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-medium", // Ajustado tamanho da fonte
                          isCurrentDay ? "text-blue-400" : "text-gray-100",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      <div className="space-y-0.5 sm:space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <motion.div
                            key={event.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2, delay: eventIndex * 0.05 }}
                            className="text-[10px] sm:text-xs"
                          >
                            <EventCard
                              event={event}
                              isCurrent={isCurrentEventActive(event)}
                              onDelete={onDeleteEvent}
                              view="month"
                            />
                          </motion.div>
                        ))}
                        {dayEvents.length > 2 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] sm:text-[10px] text-gray-400 font-medium pl-0.5"
                          >
                            +{dayEvents.length - 2} more
                          </motion.p>
                        )}
                      </div>
                    </AnimatePresence>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}