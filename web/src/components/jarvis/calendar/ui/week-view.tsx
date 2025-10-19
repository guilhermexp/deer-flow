"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import EventCard from "./event-card";
import type { CalendarEvent } from "../lib/types";
import { DAYS_OF_WEEK_ABBREVIATED, CALENDAR_HOURS } from "../lib/constants"; // Importa CALENDAR_HOURS

interface WeekViewProps {
  startOfWeek: Date;
  daysInWeek: Date[];
  getEventsForDayOfWeek: (
    dayIndex: number,
    weekStartDate: Date
  ) => CalendarEvent[];
  isCurrentEventActive: (event: CalendarEvent) => boolean;
  formatHourForDisplay: (hour: number) => string;
  isDateToday: (date: Date | null) => boolean;
  onNavigate: (direction: "next" | "prev") => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (date: Date) => void;
}

export default function WeekView({
  startOfWeek,
  daysInWeek,
  getEventsForDayOfWeek,
  isCurrentEventActive,
  formatHourForDisplay,
  isDateToday,
  onNavigate,
  onDeleteEvent,
  onAddEventClick,
}: WeekViewProps) {
  // Suppress unused variable warning - feature not implemented yet
  void onAddEventClick;
  void onNavigate;

  const cellBackgroundStyle = "bg-white/[0.02] backdrop-blur-sm";

  return (
    <section className="mt-2 space-y-6" aria-label="Week view calendar">
      <div className="hidden rounded-lg border border-white/10 p-0.5 lg:block">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px overflow-hidden rounded-md bg-white/10">
          <div className={cn(cellBackgroundStyle)}>
            <div className="flex h-16 items-center justify-center border-b border-white/10">
              <span className="text-sm font-medium text-gray-400">Time</span>
            </div>
            {/* CORREÇÃO: Usa a constante CALENDAR_HOURS */}
            {CALENDAR_HOURS.map((hour) => (
              <div
                key={hour}
                className="flex h-16 items-center justify-center border-b border-white/10 last:border-b-0"
              >
                <span className="text-xs text-gray-400">
                  {formatHourForDisplay(hour)}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {daysInWeek.map((day, index) => {
              const isToday = isDateToday(day);
              const dayEvents = getEventsForDayOfWeek(index, startOfWeek);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(cellBackgroundStyle, "relative")}
                >
                  <div
                    className={cn(
                      "flex h-16 flex-col items-center justify-center border-b border-white/10",
                      isToday && "bg-blue-500/10"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isToday ? "text-blue-400" : "text-gray-400"
                      )}
                    >
                      {DAYS_OF_WEEK_ABBREVIATED[index]}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        isToday ? "text-blue-400" : "text-gray-100"
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Time slots with events */}
                  {CALENDAR_HOURS.map((hour) => {
                    const hourEvents = dayEvents.filter((event) => {
                      return event.startHour === hour;
                    });

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="relative h-16 border-b border-white/10 p-1 last:border-b-0"
                      >
                        {hourEvents.length > 0 && (
                          <div className="space-y-1">
                            {hourEvents.slice(0, 2).map((event, eventIndex) => (
                              <motion.div
                                key={event.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: eventIndex * 0.1 }}
                              >
                                <EventCard
                                  event={event}
                                  isCurrent={isCurrentEventActive(event)}
                                  onDelete={onDeleteEvent}
                                  view="week"
                                />
                              </motion.div>
                            ))}
                            {hourEvents.length > 2 && (
                              <span className="pl-1 text-xs text-gray-400">
                                +{hourEvents.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile view */}
      <div className="space-y-4 lg:hidden">
        <div className="grid grid-cols-7 gap-2">
          <AnimatePresence mode="wait">
            {daysInWeek.map((day, index) => {
              const isToday = isDateToday(day);
              const dayEvents = getEventsForDayOfWeek(index, startOfWeek);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg border p-2",
                    isToday
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-white/10 bg-white/[0.02]"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday ? "text-blue-400" : "text-gray-400"
                    )}
                  >
                    {DAYS_OF_WEEK_ABBREVIATED[index]}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-semibold",
                      isToday ? "text-blue-400" : "text-gray-100"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="h-1 w-1 rounded-full bg-blue-400"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">
            Events this week
          </h3>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {daysInWeek.flatMap((day, dayIndex) => {
              const events = getEventsForDayOfWeek(dayIndex, startOfWeek);
              return events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isCurrent={isCurrentEventActive(event)}
                  onDelete={onDeleteEvent}
                  view="week"
                />
              ));
            }).length === 0 ? (
              <p className="py-8 text-center text-gray-400">
                No events this week
              </p>
            ) : (
              daysInWeek.flatMap((day, dayIndex) => {
                const events = getEventsForDayOfWeek(dayIndex, startOfWeek);
                return events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isCurrent={isCurrentEventActive(event)}
                    onDelete={onDeleteEvent}
                    view="week"
                  />
                ));
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
