"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { CheckSquare } from "lucide-react"
import { motion } from "framer-motion"
import { useTasks } from "~/hooks/jarvis/useTasks"
import { formatTotalTime } from "~/lib/jarvis/task-formatting-utils"
// import TaskItem from "~/components/jarvis/task-item"
import { Play, Star } from "lucide-react"
import { Button } from "~/components/ui/button"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"

export default function TodayTasksCard() {
  const { tasksByDay, setTasksByDay, currentDay } = useTasks()
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({})

  const todayTasks = useMemo(
    () => tasksByDay.filter((task) => task.day === currentDay),
    [tasksByDay, currentDay]
  )
  const taskCount = todayTasks.length

  // Only update timers for running tasks
  const runningTaskIds = useMemo(
    () => todayTasks.filter(task => task.isRunning).map(task => task.id),
    [todayTasks]
  )

  useEffect(() => {
    if (runningTaskIds.length === 0) return

    // Update timer every 5 seconds instead of every second for better performance
    const UPDATE_INTERVAL = 5000; // 5 seconds
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const updated = { ...prev }
        runningTaskIds.forEach((taskId) => {
          // Add 5 seconds each time
          updated[taskId] = (updated[taskId] || 0) + 5
        })
        return updated
      })
    }, UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [runningTaskIds])

  const handleToggleTimer = useCallback((taskId: string) => {
    setTasksByDay((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          if (task.isRunning) {
            const timeToAdd = activeTimers[taskId] || 0
            setActiveTimers((prev) => {
              const newActiveTimers = { ...prev }
              delete newActiveTimers[taskId]
              return newActiveTimers
            })
            return {
              ...task,
              isRunning: false,
              timeSpent: (task.timeSpent || 0) + timeToAdd,
            }
          } else {
            setActiveTimers((prev) => ({ ...prev, [taskId]: 0 }))
            return { ...task, isRunning: true }
          }
        }
        return task
      }),
    )
  }, [activeTimers, setTasksByDay])

  const handleToggleFavorite = useCallback((taskId: string) => {
    setTasksByDay((prev) => prev.map((task) => (task.id === taskId ? { ...task, isFavorite: !task.isFavorite } : task)))
  }, [setTasksByDay])

  const activeTasksCount = useMemo(
    () => todayTasks.filter((task) => task.isRunning).length,
    [todayTasks]
  )
  
  const totalTrackedTime = useMemo(
    () => todayTasks.reduce((total, task) => {
      const taskTime = (task.timeSpent || 0) + (task.isRunning ? activeTimers[task.id] || 0 : 0)
      return total + taskTime
    }, 0),
    [todayTasks, activeTimers]
  )

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
                            <Star
                              className={`h-4 w-4 transition-colors ${task.isFavorite ? 'fill-current text-accent-yellow' : ''}`}
                            />
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 hover:bg-muted/40 ${task.isRunning ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                            onClick={() => handleToggleTimer(task.id)}
                            aria-label={task.isRunning ? "Pause timer" : "Start timer"}
                          >
                            {task.isRunning ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <div className="w-4 h-4 bg-red-500 rounded-sm" />
                              </motion.div>
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
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
