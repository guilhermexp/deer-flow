"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { CheckSquare } from "lucide-react"
import { motion } from "framer-motion"
import { useTasksApi } from "~/hooks/jarvis/useTasksApi"
import { formatTotalTime } from "~/lib/jarvis/task-formatting-utils"
// import TaskItem from "~/components/jarvis/task-item"
import { Play, Star } from "lucide-react"
import { Button } from "~/components/ui/button"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"

export default function TodayTasksCard() {
  const { tasks, loading } = useTasksApi()
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({})

  const todayTasks = useMemo(
    () => tasks, // For now, use all tasks since we don't have day filtering
    [tasks]
  )
  const taskCount = todayTasks.length

  const handleToggleFavorite = useCallback((taskId: string) => {
    // Placeholder for future implementation
    console.log('Toggle favorite for task:', taskId)
  }, [])

  const activeTasksCount = 0
  const totalTrackedTime = 0

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl px-3 sm:px-4 pb-3 sm:pb-4 pt-4 sm:pt-5">
        <div className="pb-2">
          <h3 className="flex flex-row items-center justify-between gap-2 text-sm font-semibold">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="group">
                <CheckSquare className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-400 flex-shrink-0" />
              </div>
              <span className="text-base sm:text-lg text-white truncate">Today&apos;s tasks</span>
              {taskCount > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  {taskCount}
                </span>
              )}
            </div>
          </h3>
        </div>
        <div className="space-y-2 sm:space-y-2.5 pt-2">
          {todayTasks.length > 0 ? (
            <>
              <div className="space-y-1.5 max-h-[140px] sm:max-h-[160px] md:max-h-[180px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {todayTasks.map((task) => {
                  const priorityDotColor = task.priority === 'high' ? 'bg-red-500' : 
                                         task.priority === 'medium' ? 'bg-yellow-500' : 
                                         'bg-green-500'
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-muted/30 transition-colors duration-150"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDotColor}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate leading-tight">{task.title}</h4>
                        {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted/40 text-muted-foreground hover:text-accent-yellow"
                            onClick={() => handleToggleFavorite(task.id)}
                            aria-label="Mark as favorite"
                          >
                            <Star className="h-4 w-4 transition-colors" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalTrackedTime > 0 && (
                <div className="pt-2 sm:pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Tempo total:</span>
                    <span className="font-medium text-gray-100">{formatTotalTime(totalTrackedTime)}</span>
                  </div>
                  {activeTasksCount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm mt-1">
                      <span className="text-gray-400">Ativas:</span>
                      <span className="font-medium text-green-500">
                        {activeTasksCount} tarefa{activeTasksCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 sm:py-6 md:py-8">
              <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-500" />
              <p className="text-xs sm:text-sm text-gray-400">Nenhuma tarefa para hoje</p>
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </motion.div>
  )
}
