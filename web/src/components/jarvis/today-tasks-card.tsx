"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useTasksApi } from "~/hooks/jarvis/useTasksApi";
import { formatTotalTime } from "~/lib/jarvis/task-formatting-utils";
// import TaskItem from "~/components/jarvis/task-item"
import { Play, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";

export default function TodayTasksCard() {
  const { tasks, loading } = useTasksApi();
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  const todayTasks = useMemo(
    () => tasks, // For now, use all tasks since we don't have day filtering
    [tasks]
  );
  const taskCount = todayTasks.length;

  const handleToggleFavorite = useCallback((taskId: string) => {
    // Placeholder for future implementation
    console.log("Toggle favorite for task:", taskId);
  }, []);

  const activeTasksCount = 0;
  const totalTrackedTime = 0;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl px-3 pt-4 pb-3 sm:px-4 sm:pt-5 sm:pb-4">
        <div className="pb-2">
          <h3 className="flex flex-row items-center justify-between gap-2 text-sm font-semibold">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="group">
                <CheckSquare className="h-4 w-4 flex-shrink-0 text-gray-400 transition-colors group-hover:text-blue-400" />
              </div>
              <span className="truncate text-base text-white sm:text-lg">
                Today&apos;s tasks
              </span>
              {taskCount > 0 && (
                <span className="flex-shrink-0 rounded-full border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-400">
                  {taskCount}
                </span>
              )}
            </div>
          </h3>
        </div>
        <div className="space-y-2 pt-2 sm:space-y-2.5">
          {todayTasks.length > 0 ? (
            <>
              <div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent max-h-[140px] space-y-1.5 overflow-y-auto pr-0.5 sm:max-h-[160px] md:max-h-[180px]">
                {todayTasks.map((task) => {
                  const priorityDotColor =
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500";
                  return (
                    <div
                      key={task.id}
                      className="bg-background/40 hover:bg-muted/30 flex items-center gap-3 rounded-lg p-3 transition-colors duration-150"
                    >
                      <div
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${priorityDotColor}`}
                      />
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
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-muted/40 text-muted-foreground hover:text-accent-yellow h-8 w-8"
                            onClick={() => handleToggleFavorite(task.id)}
                            aria-label="Mark as favorite"
                          >
                            <Star className="h-4 w-4 transition-colors" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalTrackedTime > 0 && (
                <div className="border-t border-white/10 pt-2 sm:pt-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Tempo total:</span>
                    <span className="font-medium text-gray-100">
                      {formatTotalTime(totalTrackedTime)}
                    </span>
                  </div>
                  {activeTasksCount > 0 && (
                    <div className="mt-1 flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Ativas:</span>
                      <span className="font-medium text-green-500">
                        {activeTasksCount} tarefa
                        {activeTasksCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center sm:py-6 md:py-8">
              <CheckSquare className="mx-auto mb-2 h-6 w-6 text-gray-500 sm:h-8 sm:w-8" />
              <p className="text-xs text-gray-400 sm:text-sm">
                Nenhuma tarefa para hoje
              </p>
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
