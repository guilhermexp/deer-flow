"use client"
import React, { useState } from "react"
import { cn } from "~/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { CheckSquare, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"
import AnimatedCardWrapper from "~/components/jarvis/animated-card-wrapper"
import TaskCreationForm from "./task-creation-form"
// import RecentTasksList from "./recent-tasks-list"
import type { Task } from "~/lib/jarvis/task-utils"

export interface TaskManagementCardMobileProps {
  className?: string
  showCompleted?: boolean
  taskLimit?: number
}

const TaskManagementCardMobile = React.memo(({
  className,
  showCompleted = false,
  taskLimit = 5
}: TaskManagementCardMobileProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTaskCreated = (title: string, assignee?: string, tags?: string[]) => {
    console.log("Task created:", { title, assignee, tags })
    setShowCreateForm(false)
    // Force refresh of the task list
    setRefreshKey(prev => prev + 1)
  }

  const handleTaskUpdate = (task: Task) => {
    console.log("Task updated:", task)
    // You can add additional logic here if needed
  }

  return (
    <AnimatedCardWrapper delay={0.1}>
      <LiquidGlassCard className={cn("h-full rounded-xl", className)}>
        <Card className="bg-transparent border-0 shadow-none h-full">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
                <CheckSquare className="w-5 h-5 text-primary" />
                Tarefas Recentes
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCreateForm(!showCreateForm)}
                aria-label={showCreateForm ? "Fechar formulário" : "Criar nova tarefa"}
              >
                <motion.div
                  animate={{ rotate: showCreateForm ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TaskCreationForm
                  onSubmit={handleTaskCreated}
                  onClose={() => setShowCreateForm(false)}
                  className="mb-4"
                />
              </motion.div>
            )}
            
            {/* <RecentTasksList
              key={refreshKey}
              limit={taskLimit}
              showCompleted={showCompleted}
              onTaskUpdate={handleTaskUpdate}
            /> */}
            <div className="text-muted-foreground text-sm">
              Tasks list temporarily unavailable
            </div>
          </CardContent>
        </Card>
      </LiquidGlassCard>
    </AnimatedCardWrapper>
  )
})

TaskManagementCardMobile.displayName = "TaskManagementCardMobile"

export default TaskManagementCardMobile