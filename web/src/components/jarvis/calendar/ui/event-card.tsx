"use client";

import type React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Clock, Trash2 } from "lucide-react";
import type { CalendarEvent } from "../lib/types";
import { EVENT_COLORS_STYLES } from "../lib/constants";

interface EventCardProps {
  event: CalendarEvent;
  isCurrent: boolean;
  view: "day" | "week" | "month";
  onDelete: (event: CalendarEvent) => void;
}

export default function EventCard({
  event,
  isCurrent,
  view,
  onDelete,
}: EventCardProps) {
  const colors = EVENT_COLORS_STYLES[event.color] ?? EVENT_COLORS_STYLES.blue;
  if (!colors) return null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(event);
  };

  if (view === "day") {
    return (
      <Card
        className={cn(
          "group h-full cursor-pointer border bg-white/[0.05] backdrop-blur-sm transition-all duration-300",
          colors.card,
          isCurrent && colors.current,
          "hover:shadow-lg hover:shadow-white/10"
        )}
        tabIndex={0}
        role="button"
        aria-label={`${event.title} at ${event.time}`}
      >
        <CardContent className="relative flex h-full flex-col justify-center p-2 md:p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div
                className={cn(
                  "mt-1 h-2 w-2 flex-shrink-0 rounded-full md:h-2.5 md:w-2.5",
                  colors.dot
                )}
              />
              <div className="min-w-0 flex-1 text-left">
                <h3 className="truncate text-sm font-semibold text-gray-100 transition-colors group-hover:text-blue-400 md:text-base">
                  {event.title}
                </h3>
                {event.subtitle && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {event.subtitle}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={isCurrent ? "destructive" : "secondary"}
              className={cn(
                "h-auto flex-shrink-0 self-start px-1.5 py-0.5 text-[10px] md:text-xs"
              )}
            >
              {event.time}
            </Badge>
          </div>
          {isCurrent && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-red-400 md:mt-2 md:text-xs">
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span>In progress</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 md:h-6 md:w-6"
            onClick={handleDeleteClick}
            aria-label={`Delete event ${event.title}`}
          >
            <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (view === "week") {
    return (
      <Card
        className={cn(
          "group h-full cursor-pointer border bg-white/[0.05] backdrop-blur-sm transition-all duration-200",
          colors.card,
          isCurrent && colors.current,
          "hover:shadow-md"
        )}
        tabIndex={0}
        role="button"
        aria-label={`${event.title} at ${event.time}`}
      >
        <CardContent className="relative flex h-full flex-col items-center justify-center p-1 text-center">
          <div className="mb-0.5 flex w-full items-center gap-1 self-start">
            <div
              className={cn(
                "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                colors.dot
              )}
            />
            <h4 className="flex-1 truncate text-left text-[9px] leading-tight font-semibold text-gray-100 group-hover:text-blue-400 md:text-[10px]">
              {event.title}
            </h4>
          </div>
          <Badge
            variant={isCurrent ? "destructive" : "secondary"}
            className={cn(
              "h-auto self-center px-1 py-0 text-[8px] md:text-[9px]"
            )}
          >
            {event.time}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/80 hover:text-destructive-foreground absolute top-0 right-0 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 md:h-5 md:w-5"
            onClick={handleDeleteClick}
            aria-label={`Delete event ${event.title}`}
          >
            <Trash2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Month view
  return (
    <Card
      className={cn(
        "group bg-card cursor-pointer border text-[9px] backdrop-blur-sm transition-all duration-200 md:text-[10px]",
        colors.card,
        isCurrent && colors.current,
        "hover:shadow-sm"
      )}
      tabIndex={0}
      role="button"
    >
      <CardContent className="relative p-1">
        <div className="mb-0.5 flex items-center gap-1">
          <div
            className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", colors.dot)}
          />
          <span className="text-card-foreground flex-1 truncate text-left font-medium">
            {event.title}
          </span>
        </div>
        <div className="flex items-center justify-start">
          <Badge
            variant={isCurrent ? "destructive" : "secondary"}
            className={cn("h-auto px-1 py-0 text-[8px]")}
          >
            {event.time}
          </Badge>
          {isCurrent && (
            <Clock className="text-destructive-foreground ml-0.5 h-1.5 w-1.5 md:h-2 md:w-2" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-destructive/80 hover:text-destructive-foreground absolute top-0 right-0 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 md:h-5 md:w-5"
          onClick={handleDeleteClick}
          aria-label={`Delete event ${event.title}`}
        >
          <Trash2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
