"use client";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { CALENDAR_FILTERS, CALENDAR_VIEW_MODES } from "../lib/constants"; // Import both
import type { CalendarFilter, CalendarViewMode } from "../lib/types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  activeFilter: CalendarFilter;
  setActiveFilter: (filter: CalendarFilter) => void;
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  onTodayClick: () => void;
  onNewEventClick: () => void;
  onNavigate: (direction: "next" | "prev") => void;
  currentDate: Date;
  monthDisplayDate?: Date;
  eventCount?: number;
}

export function CalendarHeader({
  activeFilter,
  setActiveFilter,
  viewMode,
  setViewMode,
  onTodayClick,
  onNewEventClick,
  onNavigate,
  currentDate,
  monthDisplayDate,
  eventCount = 0,
}: CalendarHeaderProps) {
  const getDateDisplay = () => {
    if (viewMode === "month" && monthDisplayDate) {
      return monthDisplayDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + 6);
      return `${currentDate.getDate()} - ${endOfWeek.getDate()} ${currentDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
  };
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-b border-white/10 px-3 py-1.5 sm:flex-row sm:px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("prev")}
            className="h-7 w-7 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("next")}
            className="h-7 w-7 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
            aria-label="Próximo"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">
            {getDateDisplay()}
          </h2>
          <Badge
            variant="secondary"
            className="border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300"
          >
            {eventCount} evento{eventCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        {/* View Mode Switcher Buttons */}
        <div className="order-1 flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.05] p-0.5 sm:order-none">
          {CALENDAR_VIEW_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode(mode.value as CalendarViewMode)}
              className={cn(
                "h-auto px-2 py-0.5 text-[10px] transition-colors sm:text-xs",
                viewMode === mode.value
                  ? "border border-blue-500/30 bg-blue-500/20 text-blue-400 shadow-sm hover:bg-blue-500/30"
                  : "text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
              )}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Event Type Filter Buttons (as seen in screenshot) */}
        <div className="order-2 flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.05] p-0.5 sm:order-none">
          {CALENDAR_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter.value as CalendarFilter)}
              className={cn(
                "h-auto px-2 py-0.5 text-[10px] transition-colors sm:text-xs",
                activeFilter === filter.value
                  ? "bg-white/10 text-gray-100 shadow-sm"
                  : "text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="order-3 flex items-center gap-1.5 sm:order-none">
          <Button
            onClick={onTodayClick}
            variant="outline"
            size="sm"
            className="h-7 border-white/10 bg-white/[0.05] px-2 text-xs text-gray-100 hover:bg-white/[0.08]"
          >
            Hoje
          </Button>
          <Button
            onClick={onNewEventClick}
            size="sm"
            className="h-7 border border-blue-500/50 bg-blue-500/20 px-2 text-xs text-blue-400 hover:bg-blue-500/30"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
