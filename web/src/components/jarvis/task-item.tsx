"use client";
import { motion } from "framer-motion";
import { Play, Pause, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Task } from "~/components/jarvis/kanban/lib/types";

interface TaskItemProps {
  task: Task;
  onToggleTimer: (taskId: string) => void;
  onToggleFavorite: (taskId: string) => void;
  activeTime: number;
}

export default function TaskItem({
  task,
  onToggleTimer,
  onToggleFavorite,
}: TaskItemProps) {
  // const totalTime = (task.timeSpent || 0) + (task.isRunning ? activeTime : 0) // Not used currently
  // Default to green since Task type doesn't have priority
  const priorityDotColor = "bg-green-500";

  return (
    <div
      className="bg-background/40 hover:bg-muted/30 flex items-center gap-3 rounded-lg p-3 transition-colors duration-150" // Adjusted padding, bg, hover
    >
      <div
        className={`h-2 w-2 flex-shrink-0 rounded-full ${priorityDotColor}`}
      />{" "}
      {/* Priority dot */}
      <div className="min-w-0 flex-1">
        <h4 className="text-foreground truncate text-sm leading-tight font-medium">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/40 text-muted-foreground hover:text-accent-yellow h-8 w-8" // Adjusted size & hover
            onClick={() => onToggleFavorite(task.id)}
            aria-label={"Mark as favorite"}
          >
            <Star className={`h-4 w-4 transition-colors`} />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-muted/40 h-8 w-8 text-green-400 hover:text-green-300`} // Adjusted size & colors
            onClick={() => onToggleTimer(task.id)}
            aria-label={"Start timer"}
          >
            <Play className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
