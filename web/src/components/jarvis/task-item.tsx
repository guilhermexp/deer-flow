"use client"
import { motion } from "framer-motion"
import { Play, Pause, Star } from "lucide-react"
import { Button } from "~/components/ui/button"
import type { Task } from "~/components/jarvis/kanban/lib/types"

interface TaskItemProps {
  task: Task
  onToggleTimer: (taskId: string) => void
  onToggleFavorite: (taskId: string) => void
  activeTime: number
}

export default function TaskItem({ task, onToggleTimer, onToggleFavorite }: TaskItemProps) {
  // const totalTime = (task.timeSpent || 0) + (task.isRunning ? activeTime : 0) // Not used currently
  // Default to green since Task type doesn't have priority
  const priorityDotColor = "bg-green-500"

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-muted/30 transition-colors duration-150" // Adjusted padding, bg, hover
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDotColor}`} /> {/* Priority dot */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate leading-tight">{task.title}</h4>
        {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted/40 text-muted-foreground hover:text-accent-yellow" // Adjusted size & hover
            onClick={() => onToggleFavorite(task.id)}
            aria-label={"Mark as favorite"}
          >
            <Star
              className={`h-4 w-4 transition-colors`}
            />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 hover:bg-muted/40 text-green-400 hover:text-green-300`} // Adjusted size & colors
            onClick={() => onToggleTimer(task.id)}
            aria-label={"Start timer"}
          >
            <Play className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}