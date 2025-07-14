"use client"

import type * as React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { FixedSizeList, type ListChildComponentProps } from "react-window"
import { cn } from "~/lib/utils"
import type { Task, Column as ColumnType } from "../lib/types"
import KanbanTaskCard from "./kanban-task-card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Plus } from "lucide-react"
// AnimatePresence is removed as FixedSizeList handles its own item rendering lifecycle.
// Individual item animations within KanbanTaskCard can still work.

interface KanbanColumnProps {
  column: ColumnType
  onAddTask: (columnId: string) => void // Should be TaskStatus
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onDragStartTask: (e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent, task: Task) => void
  onDragEnd?: () => void
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, columnId: string) => void // Should be TaskStatus
  isDragOver: boolean
  isDragging?: boolean
  draggedTask?: Task | null
}

const ITEM_HEIGHT = 90 // Estimated height for KanbanTaskCard + spacing. Adjust as needed.
const ENABLE_FIXED_SIZE_LIST = false // Temporariamente desabilitado para debug

export default function KanbanColumn({
  column,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDragStartTask,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  isDragging = false,
  draggedTask,
}: KanbanColumnProps) {
  const IconComponent = column.icon
  const listRef = useRef<FixedSizeList | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
          setContainerWidth(entry.contentRect.width)
        }
      })
      resizeObserver.observe(containerRef.current)
      // Initial size
      setContainerHeight(containerRef.current.clientHeight)
      setContainerWidth(containerRef.current.clientWidth)
      return () => resizeObserver.disconnect()
    }
  }, [])

  // Callback for rendering each task card
  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const task = column.tasks[index]
    if (!task) return null

    return (
      <div style={style} className="px-2 pb-1"> {/* Apply style here, add padding for spacing */}
        <div /* Wrapper to apply opacity and other effects if needed, similar to old structure */
          className={cn(
            "transition-all duration-200",
            isDragging && draggedTask?.id !== task.id && "opacity-60"
          )}
        >
          <KanbanTaskCard
            task={task}
            columnColor={column.color}
            progressColor={column.progressColor}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDragStart={onDragStartTask}
            onDragEnd={onDragEnd}
            isDragging={isDragging && draggedTask?.id === task.id}
            index={index} // index prop might still be useful for staggered animations inside card
          />
        </div>
      </div>
    )
  }, [column.tasks, column.color, column.progressColor, onEditTask, onDeleteTask, onDragStartTask, onDragEnd, isDragging, draggedTask])


  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 transition-colors flex flex-col kanban-column bg-white/[0.02] backdrop-blur-sm min-h-[400px]", // Adicionado min-height
        isDragOver ? "drop-zone-active" : "",
      )}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDragOver(e, column.id)
      }}
      onDragLeave={(e) => {
        const relatedTarget = e.relatedTarget as HTMLElement
        const currentTarget = e.currentTarget as HTMLElement
        if (relatedTarget && !currentTarget.contains(relatedTarget)) {
          e.stopPropagation()
          onDragLeave()
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop(e, column.id)
      }}
      aria-labelledby={`column-title-${column.id}`}
    >
      <div className="flex items-center justify-between p-2 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10 border-b border-white/10 mb-1"> {/* Added mb-1 for spacing */}
        <div className="flex items-center gap-2">
          <IconComponent className={cn("h-4 w-4", column.color)} />
          <h3 id={`column-title-${column.id}`} className="font-medium text-base text-white"> {/* Adicionado text-base */}
            {column.title}
          </h3>
          <Badge variant="secondary" className="bg-white/10 text-gray-300 border-white/10">
            {column.tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddTask(column.id)}
          className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-white/[0.08]"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className={cn(
          // Removed space-y-3, px-2, pb-2. Overflow is handled by FixedSizeList.
          "flex-grow transition-all duration-200 relative overflow-hidden min-h-[300px]" // Added min-height
        )}
      >
        {column.tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 py-10 px-2">
            Nenhuma tarefa aqui.
          </div>
        ) : ENABLE_FIXED_SIZE_LIST && containerHeight > 0 && containerWidth > 0 ? (
          <FixedSizeList
            ref={listRef}
            height={containerHeight}
            width={containerWidth}
            itemCount={column.tasks.length}
            itemSize={ITEM_HEIGHT}
            overscanCount={5}
            className="kanban-task-list"
          >
            {Row}
          </FixedSizeList>
        ) : (
          // Fallback para renderização simples
          <div className="space-y-1.5 px-2 pb-2">
            {column.tasks.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "transition-all duration-200",
                  isDragging && draggedTask?.id !== task.id && "opacity-60"
                )}
              >
                <KanbanTaskCard
                  task={task}
                  columnColor={column.color}
                  progressColor={column.progressColor}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onDragStart={onDragStartTask}
                  onDragEnd={onDragEnd}
                  isDragging={isDragging && draggedTask?.id === task.id}
                  index={index}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
