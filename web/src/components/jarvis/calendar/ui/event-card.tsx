"use client"

import type React from "react"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { Clock, Trash2 } from "lucide-react"
import type { CalendarEvent } from "../lib/types"
import { EVENT_COLORS_STYLES } from "../lib/constants"

interface EventCardProps {
  event: CalendarEvent
  isCurrent: boolean
  view: "day" | "week" | "month"
  onDelete: (event: CalendarEvent) => void
}

export default function EventCard({ event, isCurrent, view, onDelete }: EventCardProps) {
  const colors = EVENT_COLORS_STYLES[event.color] ?? EVENT_COLORS_STYLES.blue
  if (!colors) return null

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(event)
  }

  if (view === "day") {
    return (
      <Card
        className={cn(
          "h-full border backdrop-blur-sm transition-all duration-300 cursor-pointer group bg-white/[0.05]",
          colors.card,
          isCurrent && colors.current,
          "hover:shadow-lg hover:shadow-white/10",
        )}
        tabIndex={0}
        role="button"
        aria-label={`${event.title} at ${event.time}`}
      >
        <CardContent className="p-2 md:p-3 h-full flex flex-col justify-center relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className={cn("w-2 h-2 md:w-2.5 md:h-2.5 rounded-full mt-1 flex-shrink-0", colors.dot)} />
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm md:text-base font-semibold text-gray-100 truncate group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h3>
                {event.subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{event.subtitle}</p>}
              </div>
            </div>
            <Badge
              variant={isCurrent ? "destructive" : "secondary"}
              className={cn(
                "flex-shrink-0 text-[10px] md:text-xs self-start px-1.5 py-0.5 h-auto"
              )}
            >
              {event.time}
            </Badge>
          </div>
          {isCurrent && (
            <div className="flex items-center gap-1 mt-1 md:mt-2 text-[10px] md:text-xs text-red-400 font-medium">
              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span>In progress</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-1 right-1 h-5 w-5 md:h-6 md:w-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
            onClick={handleDeleteClick}
            aria-label={`Delete event ${event.title}`}
          >
            <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (view === "week") {
    return (
      <Card
        className={cn(
          "h-full border backdrop-blur-sm transition-all duration-200 cursor-pointer group bg-white/[0.05]",
          colors.card,
          isCurrent && colors.current,
          "hover:shadow-md",
        )}
        tabIndex={0}
        role="button"
        aria-label={`${event.title} at ${event.time}`}
      >
        <CardContent className="p-1 h-full flex flex-col justify-center items-center text-center relative">
          <div className="flex items-center gap-1 mb-0.5 self-start w-full">
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
            <h4 className="text-[9px] md:text-[10px] leading-tight font-semibold text-gray-100 truncate group-hover:text-blue-400 flex-1 text-left">
              {event.title}
            </h4>
          </div>
          <Badge
            variant={isCurrent ? "destructive" : "secondary"}
            className={cn(
              "text-[8px] md:text-[9px] px-1 py-0 h-auto self-center"
            )}
          >
            {event.time}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-4 w-4 md:h-5 md:w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80 hover:text-destructive-foreground"
            onClick={handleDeleteClick}
            aria-label={`Delete event ${event.title}`}
          >
            <Trash2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Month view
  return (
    <Card
      className={cn(
        "border backdrop-blur-sm transition-all duration-200 cursor-pointer group text-[9px] md:text-[10px] bg-card",
        colors.card,
        isCurrent && colors.current,
        "hover:shadow-sm",
      )}
      tabIndex={0}
      role="button"
    >
      <CardContent className="p-1 relative">
        <div className="flex items-center gap-1 mb-0.5">
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
          <span className="font-medium text-card-foreground truncate text-left flex-1">{event.title}</span>
        </div>
        <div className="flex items-center justify-start">
          <Badge
            variant={isCurrent ? "destructive" : "secondary"}
            className={cn(
              "px-1 py-0 h-auto text-[8px]"
            )}
          >
            {event.time}
          </Badge>
          {isCurrent && <Clock className="w-1.5 h-1.5 md:w-2 md:h-2 text-destructive-foreground ml-0.5" />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-4 w-4 md:h-5 md:w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80 hover:text-destructive-foreground"
          onClick={handleDeleteClick}
          aria-label={`Delete event ${event.title}`}
        >
          <Trash2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
        </Button>
      </CardContent>
    </Card>
  )
}
