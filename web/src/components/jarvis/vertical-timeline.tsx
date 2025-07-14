"use client"
import { useState } from "react"
import { cn } from "~/lib/utils"
import { Card, CardContent, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Button } from "~/components/ui/button"
import {
  Moon,
  Sun,
  Check,
  Footprints,
  Dumbbell,
  Snowflake,
  Salad,
  Thermometer,
  MoreHorizontal,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Icon mapping for activity types
const iconMap = {
  sleep: Moon,
  wakeup: Sun,
  checkin: Check,
  walk: Footprints,
  workout: Dumbbell,
  cold: Snowflake,
  nutrition: Salad,
  sauna: Thermometer,
} as const

// Updated color map to use standard Tailwind colors
const colorMap: Record<keyof typeof iconMap, string> = {
  sleep: "bg-indigo-500",
  wakeup: "bg-yellow-500",
  checkin: "bg-green-500",
  walk: "bg-teal-500",
  workout: "bg-slate-500",
  cold: "bg-cyan-400",
  sauna: "bg-rose-500",
  nutrition: "bg-green-500",
}

export interface WorkoutSet {
  exercise: string
  sets: number
  reps: number
  totalReps: number
}

export interface NutritionMacro {
  type: "protein" | "carbs" | "fat"
  amount: number
  unit: string
}

export interface TimelineEntry {
  id: string
  time: string
  type: keyof typeof iconMap
  title: string
  subtitle?: string
  duration?: string
  calories?: number
  workoutSets?: WorkoutSet[]
  nutritionMacros?: NutritionMacro[]
  hasDetails?: boolean
}

export interface VerticalTimelineProps {
  entries: TimelineEntry[]
  className?: string
}

export default function VerticalTimeline({ entries, className }: VerticalTimelineProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  const getMacroColorClasses = (type: NutritionMacro["type"]) => {
    switch (type) {
      case "protein":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
      case "carbs":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40"
      case "fat":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40"
      default:
        return "bg-muted/30 text-muted-foreground border-muted/40"
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="relative">
        {/* Adjusted left position for timeline line for smaller screens */}
        <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-border/50" />
        {/* Adjusted spacing between entries */}
        <div className="space-y-3 sm:space-y-4">
          {entries.map((entry, index) => {
            const IconComponent = iconMap[entry.type]
            const isExpanded = expandedEntries.has(entry.id)
            const hasExpandableContent =
              entry.hasDetails && (entry.workoutSets?.length || entry.nutritionMacros?.length)

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                // Adjusted gap for smaller screens
                className="relative flex items-start gap-2 sm:gap-3"
              >
                {/* Adjusted width and padding for time display */}
                <div className="flex-shrink-0 w-8 sm:w-10 text-right pt-1.5 sm:pt-2.5">
                  {/* Adjusted font size for time */}
                  <span className="text-[0.7rem] sm:text-xs font-medium text-muted-foreground">{entry.time}</span>
                </div>
                <div className="relative flex-shrink-0 z-10">
                  {/* Adjusted icon container size */}
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
                      colorMap[entry.type],
                      "shadow-md border-2 border-background",
                    )}
                  >
                    {/* Adjusted icon size */}
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Collapsible open={isExpanded} onOpenChange={() => hasExpandableContent && toggleExpanded(entry.id)}>
                    <Card className="group hover:shadow-md transition-all duration-200 bg-background/60 backdrop-blur-sm border border-border/40 hover:border-border/60 rounded-lg">
                      <CollapsibleTrigger asChild disabled={!hasExpandableContent}>
                        {/* Adjusted padding for card trigger */}
                        <div
                          className={cn(
                            "w-full p-3 sm:p-4",
                            hasExpandableContent ? "cursor-pointer" : "cursor-default",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              {/* Adjusted font size for title */}
                              <CardTitle className="text-sm sm:text-base font-semibold leading-tight text-foreground">
                                {entry.title}
                              </CardTitle>
                              {entry.subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed">
                                  {entry.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2">
                              {hasExpandableContent && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  // Adjusted button size for smaller screens
                                  className="h-6 w-6 sm:h-7 sm:w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                                  aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                >
                                  <ChevronUp className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                                aria-label="More options"
                              >
                                <MoreHorizontal className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                          {(entry.duration || entry.calories) && (
                            // Adjusted margin-top for smaller screens
                            <div className="flex items-center gap-2 sm:gap-3 text-[0.7rem] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                              {entry.duration && <span>{entry.duration}</span>}
                              {entry.calories && <span>{entry.calories} kcal</span>}
                            </div>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <AnimatePresence>
                        {isExpanded && hasExpandableContent && (
                          <CollapsibleContent forceMount>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              {/* Adjusted padding for card content (details) */}
                              <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-4">
                                {entry.workoutSets && entry.workoutSets.length > 0 && (
                                  <div className="space-y-1.5 sm:space-y-2 mt-1.5 sm:mt-2">
                                    <h5 className="text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">
                                      Workout Details
                                    </h5>
                                    <ul className="space-y-1 sm:space-y-1.5">
                                      {entry.workoutSets.map((set, setIndex) => (
                                        <li
                                          key={setIndex}
                                          // Adjusted padding for workout items
                                          className="flex items-center justify-between py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-md bg-muted/20 text-xs"
                                        >
                                          <div className="flex items-center gap-1 sm:gap-1.5">
                                            <span className="font-medium text-foreground">{set.sets}x</span>
                                            <span className="text-foreground">{set.exercise}</span>
                                          </div>
                                          <span className="text-muted-foreground">{set.totalReps} reps</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {entry.nutritionMacros && entry.nutritionMacros.length > 0 && (
                                  <div className="mt-2 sm:mt-3">
                                    <h5 className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                                      Nutrition
                                    </h5>
                                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                      {entry.nutritionMacros.map((macro, macroIndex) => (
                                        <Badge
                                          key={macroIndex}
                                          variant="outline"
                                          className={cn(
                                            // Adjusted padding for badges
                                            "text-xs font-medium px-1 sm:px-1.5 py-0.5",
                                            getMacroColorClasses(macro.type),
                                          )}
                                        >
                                          <span className="capitalize mr-0.5 sm:mr-1">
                                            {macro.type.charAt(0).toUpperCase() + macro.type.slice(1)}:
                                          </span>
                                          {macro.amount}
                                          {macro.unit}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </motion.div>
                          </CollapsibleContent>
                        )}
                      </AnimatePresence>
                    </Card>
                  </Collapsible>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
