"use client";

import type React from "react";
import { useState, useCallback } from "react";
import type { Task, TaskStatus } from "../lib/types";

export function useKanbanDragDrop(onUpdateTask: (task: Task) => void) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (
      e: React.DragEvent | MouseEvent | TouchEvent | PointerEvent,
      task: Task
    ) => {
      setDraggedTask(task);
      setIsDragging(true);

      // Add global classes for drag control
      document.body.classList.add("dragging-active");

      if ("dataTransfer" in e && e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.setData("application/json", JSON.stringify(task));

        // Create a transparent drag image for better visual control
        const dragImage = new Image();
        dragImage.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        e.dataTransfer.setDragImage(dragImage, 0, 0);
      }
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    // Clear global drag classes
    document.body.classList.remove("dragging-active");

    setDraggedTask(null);
    setDragOverColumn(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      // Only update if column changed to avoid unnecessary re-renders
      if (dragOverColumn !== columnId) {
        setDragOverColumn(columnId);
      }
    },
    [dragOverColumn]
  );

  const handleDragLeave = useCallback(() => {
    // Small delay to avoid flickering between elements
    setTimeout(() => {
      setDragOverColumn(null);
    }, 50);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, columnId: TaskStatus) => {
      e.preventDefault();
      e.stopPropagation();

      if (draggedTask && draggedTask.status !== columnId) {
        const updatedTask = { ...draggedTask, status: columnId };
        onUpdateTask(updatedTask);
      }

      // Reset states
      setDraggedTask(null);
      setDragOverColumn(null);
      setIsDragging(false);
      document.body.classList.remove("dragging-active");
    },
    [draggedTask, onUpdateTask]
  );

  return {
    draggedTask,
    dragOverColumn,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
