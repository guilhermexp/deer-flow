"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import type { Task } from "../lib/types";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  MessageCircle,
  Paperclip,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
} from "lucide-react";

interface KanbanTaskCardSimpleProps {
  task: Task;
  columnColor: string;
  progressColor: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  index: number;
}

export default function KanbanTaskCardSimple({
  task,
  progressColor,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  isDragging,
}: KanbanTaskCardSimpleProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    onDragStart(e, task);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "kanban-task-card mb-3 cursor-grab hover:cursor-grab active:cursor-grabbing",
        "bg-card rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
        isDragging && "cursor-grabbing opacity-50"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <time className="text-muted-foreground text-xs">{task.date}</time>
        <div className="flex items-center gap-1">
          <GripVertical className="text-muted-foreground/50 h-3 w-3" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEditTask(task)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h4 className="mb-3 text-sm font-semibold">{task.title}</h4>

      {task.progress > 0 && (
        <Progress
          value={task.progress}
          className={cn("mb-3 h-2", progressColor)}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.comments && task.comments > 0 && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <MessageCircle className="h-3 w-3" />
              <span>{task.comments}</span>
            </div>
          )}
          {task.attachments && task.attachments > 0 && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments}</span>
            </div>
          )}
        </div>
        {task.assignees && task.assignees.length > 0 && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {task.assignees[0]?.name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
