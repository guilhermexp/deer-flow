"use client";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayViewHeaderProps {
  currentDate: Date;
  eventCount: number;
  onNavigate: (direction: "next" | "prev") => void;
}

export default function DayViewHeader({
  currentDate,
  eventCount,
  onNavigate,
}: DayViewHeaderProps) {
  return (
    <div className="border-border flex flex-col justify-between gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <h2 className="text-foreground text-2xl font-bold">
          {currentDate.toLocaleDateString("pt-BR", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <Badge
          variant="outline"
          className="text-muted-foreground border-border bg-card/50 w-fit"
        >
          {eventCount} evento{eventCount !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("prev")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("next")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Próximo dia"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
