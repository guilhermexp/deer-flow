"use client";

// Importa os novos subcomponentes
import DayViewTimeColumn from "./day-view/day-view-time-column";
import DayViewEventArea from "./day-view/day-view-event-area";

import type { CalendarEvent } from "../lib/types";

interface DayViewProps {
  currentDate: Date;
  eventsForSelectedDay: CalendarEvent[];
  relevantHours: number[];
  currentTimePosition: number | null;
  isCurrentEventActive: (event: CalendarEvent) => boolean;
  formatHourForDisplay: (hour: number) => string;
  onNavigate: (direction: "next" | "prev") => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (date: Date) => void;
}

export default function DayView({
  currentDate,
  eventsForSelectedDay,
  relevantHours,
  currentTimePosition,
  isCurrentEventActive,
  formatHourForDisplay,
  onNavigate,
  onDeleteEvent,
  onAddEventClick,
}: DayViewProps) {
  // Suppress unused variable warning - feature not implemented yet
  void onAddEventClick;
  return (
    <section
      className="space-y-6"
      aria-label="Visualização diária do calendário"
    >
      <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
        <div className="grid grid-cols-[80px_1fr] gap-6">
          <DayViewTimeColumn
            relevantHours={relevantHours}
            formatHourForDisplay={formatHourForDisplay}
            currentTimePosition={currentTimePosition}
          />
          <DayViewEventArea
            relevantHours={relevantHours}
            eventsForSelectedDay={eventsForSelectedDay}
            isCurrentEventActive={isCurrentEventActive}
            onDeleteEvent={onDeleteEvent}
          />
        </div>
      </div>
    </section>
  );
}
