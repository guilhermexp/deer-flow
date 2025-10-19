"use client";

import type * as React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "~/lib/utils";
import type { Task, Column as ColumnType } from "../lib/types";
import KanbanTaskCard from "./kanban-task-card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus } from "lucide-react";
// AnimatePresence is removed as FixedSizeList handles its own item rendering lifecycle.
// Individual item animations within KanbanTaskCard can still work.

interface KanbanColumnProps {
  column: ColumnType;
  onAddTask: (columnId: string) => void; // Should be TaskStatus
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDragStartTask: (
    e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent,
    task: Task
  ) => void;
  onDragEnd?: () => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, columnId: string) => void; // Should be TaskStatus
  isDragOver: boolean;
  isDragging?: boolean;
  draggedTask?: Task | null;
}

const ITEM_HEIGHT = 90; // Estimated height for KanbanTaskCard + spacing. Adjust as needed.
const ENABLE_FIXED_SIZE_LIST = false; // Temporariamente desabilitado para debug

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
  const IconComponent = column.icon;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: column.tasks.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <section
      className={cn(
        "kanban-column flex min-h-[400px] flex-col rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-colors", // Adicionado min-height
        isDragOver ? "drop-zone-active" : ""
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(e, column.id);
      }}
      onDragLeave={(e) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        if (relatedTarget && !currentTarget.contains(relatedTarget)) {
          e.stopPropagation();
          onDragLeave();
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, column.id);
      }}
      aria-labelledby={`column-title-${column.id}`}
    >
      <div className="sticky top-0 z-10 mb-1 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/80 p-2 backdrop-blur-sm">
        {" "}
        {/* Added mb-1 for spacing */}
        <div className="flex items-center gap-2">
          <IconComponent className={cn("h-4 w-4", column.color)} />
          <h3
            id={`column-title-${column.id}`}
            className="text-base font-medium text-white"
          >
            {" "}
            {/* Adicionado text-base */}
            {column.title}
          </h3>
          <Badge
            variant="secondary"
            className="border-white/10 bg-white/10 text-gray-300"
          >
            {column.tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddTask(column.id)}
          className="h-8 w-8 text-gray-400 hover:bg-white/[0.08] hover:text-gray-100"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className={cn(
          // Removed space-y-3, px-2, pb-2. Overflow is handled by FixedSizeList.
          "relative min-h-[300px] flex-grow overflow-hidden transition-all duration-200" // Added min-height
        )}
      >
        {column.tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center px-2 py-10 text-sm text-gray-400">
            Nenhuma tarefa aqui.
          </div>
        ) : ENABLE_FIXED_SIZE_LIST ? (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const task = column.tasks[virtualItem.index];
              if (!task) return null;

              return (
                <div
                  key={task.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="px-2 pb-1"
                >
                  <div
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
                      index={virtualItem.index}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
  );
}
