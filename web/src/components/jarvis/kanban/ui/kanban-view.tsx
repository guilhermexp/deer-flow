"use client"

import type { Column, Task, TaskStatus } from "../lib/types"
import KanbanColumn from "./kanban-column"
import { Diamond, Pause, Circle, CheckCircle } from "lucide-react"
import React from "react"

interface KanbanViewProps {
  tasks: Task[]
  searchQuery: string
  onAddTask: (columnId: TaskStatus) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onDragStartTask: (e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent, task: Task) => void
  onDragEnd?: () => void
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, columnId: TaskStatus) => void
  dragOverColumn: string | null
  isDragging?: boolean
  draggedTask?: Task | null
}

const columnsDefinition: Omit<Column, "tasks">[] = [
  {
    id: "not-started",
    title: "Não iniciado",
    status: "not-started",
    icon: Diamond,
    color: "text-cyan-400",
    progressColor: "bg-cyan-500",
  },
  {
    id: "paused",
    title: "Pausado",
    status: "paused",
    icon: Pause,
    color: "text-yellow-400",
    progressColor: "bg-yellow-500",
  },
  {
    id: "in-progress",
    title: "Em progresso",
    status: "in-progress",
    icon: Circle,
    color: "text-blue-400",
    progressColor: "bg-blue-500",
  },
  {
    id: "done",
    title: "Concluído",
    status: "done",
    icon: CheckCircle,
    color: "text-green-400",
    progressColor: "bg-green-500",
  },
]

export default function KanbanView({
  tasks,
  searchQuery,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDragStartTask,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverColumn,
  isDragging = false,
  draggedTask,
}: KanbanViewProps) {
  const processedColumns: Column[] = React.useMemo(() => {
    // As tarefas já vêm filtradas do hook useKanbanTasks
    return columnsDefinition.map((colDef) => ({
      ...colDef,
      tasks: tasks.filter((task) => task.status === colDef.status),
    }))
  }, [tasks])

  return (
    <div className="kanban-view-container h-full overflow-auto">
      <div className="kanban-columns-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-2 h-full">
        {processedColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onAddTask={() => onAddTask(column.status)}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDragStartTask={onDragStartTask}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, column.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, column.status)}
            isDragOver={dragOverColumn === column.id}
            isDragging={isDragging}
            draggedTask={draggedTask}
          />
        ))}
      </div>
    </div>
  )
}
