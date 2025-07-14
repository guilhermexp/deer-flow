"use client"

import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DayViewHeaderProps {
  currentDate: Date
  eventCount: number
  onNavigate: (direction: "next" | "prev") => void
}

export default function DayViewHeader({ currentDate, eventCount, onNavigate }: DayViewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          {currentDate.toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        <Badge variant="outline" className="text-muted-foreground border-border w-fit bg-card/50">
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
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("next")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Próximo dia"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
