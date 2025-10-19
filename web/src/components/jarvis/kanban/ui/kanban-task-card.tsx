"use client";

import * as React from "react";
import { memo } from "react";
import { motion } from "framer-motion";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";
import { cn } from "~/lib/utils";
import type { Task } from "../lib/types";
import { Card, CardContent } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, GripVertical } from "lucide-react";

interface KanbanTaskCardProps {
  task: Task;
  columnColor: string;
  progressColor: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDragStart: (
    e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent,
    task: Task
  ) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  index: number;
}

const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  columnColor,
  progressColor,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  isDragging = false,
  index,
}: KanbanTaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, task);
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <article
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-label={`Task: ${task.title}`}
      className={cn(
        "kanban-task-card relative transition-all duration-200 select-none",
        isDragging
          ? "being-dragged"
          : "cursor-grab hover:cursor-grab active:cursor-grabbing"
      )}
    >
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
      >
        <LiquidGlassCard className="rounded-lg">
          {/* O Card interno agora define o estilo base conforme o guia */}
          <Card className="group rounded-lg border-0 bg-transparent shadow-none">
            <CardContent className="space-y-1 p-2">
              <div className="flex items-center justify-between">
                <time className="text-xs text-gray-400" dateTime={task.date}>
                  {task.date}
                </time>
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-gray-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-mr-1 h-5 w-5 text-gray-400 hover:text-gray-100"
                        aria-label="Task options"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEditTask(task)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar Tarefa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteTask(task)}
                        className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar Tarefa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <h4 className="line-clamp-2 text-sm font-medium text-gray-100">
                {task.title}
              </h4>
              <Progress
                value={task.progress}
                className="h-1 bg-white/10"
                indicatorClassName={progressColor}
              />
              <div className="flex items-center justify-end">
                <span className={cn("text-xs font-medium", columnColor)}>
                  {task.progress}%
                </span>
              </div>
            </CardContent>
          </Card>
        </LiquidGlassCard>
      </motion.div>
    </article>
  );
});

export default KanbanTaskCard;
