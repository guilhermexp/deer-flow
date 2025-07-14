"use client"

import * as React from "react"
import { memo } from "react"
import { cn } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import type { Task, TaskWeekDay } from "../lib/types"
import type { WeekDayDefinition } from "~/lib/kanban-utils"
import KanbanTaskCard from "./kanban-task-card"
import { 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  CheckCircle, 
  Sun, 
  Moon 
} from "lucide-react"

// Map icon names to actual icon components
const iconMap = {
  Calendar,
  Clock,
  Target,
  Zap,
  CheckCircle,
  Sun,
  Moon,
}

interface KanbanDayColumnProps {
  column: WeekDayDefinition & { tasks: Task[] }
  isDragOver: boolean
  draggedTask: Task | null
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, day: TaskWeekDay) => void
  onAddTaskToDay: (day: TaskWeekDay) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onDragStart: (e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent, task: Task) => void
  onDragEnd: () => void
}

const KanbanDayColumn = memo(function KanbanDayColumn({
  column,
  isDragOver,
  draggedTask,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddTaskToDay,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
}: KanbanDayColumnProps) {
  const Icon = iconMap[column.icon as keyof typeof iconMap]

  return (
    <section
      className={cn(
        "flex-shrink-0 w-full md:w-72 space-y-3 h-full rounded-lg border transition-colors kanban-column bg-white/[0.02] backdrop-blur-sm min-h-[400px] flex flex-col",
        isDragOver ? "drop-zone-active border-white/20" : "border-white/10",
      )}
      onDragOver={(e) => onDragOver(e, column.id as string)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <header className="flex items-center justify-between p-2 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10 border-b border-white/10">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn("h-4 w-4", column.color)} />}
          <h3 className="font-medium text-white">{column.title}</h3>
          <Badge variant="secondary" className="bg-white/10 text-gray-300 border-white/10">
            {column.tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddTaskToDay(column.id)}
          className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-white/[0.08]"
          aria-label={`Adicionar tarefa à ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto px-2 pb-2 kanban-task-list min-h-[300px]">
        <div className="space-y-1.5">
          <AnimatePresence>
            {column.tasks.map((task, index) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                columnColor={column.color}
                progressColor={column.progressColor}
                isDragging={draggedTask?.id === task.id}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
})

export default KanbanDayColumn