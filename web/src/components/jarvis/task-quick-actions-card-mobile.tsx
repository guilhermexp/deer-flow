"use client"
import React, { useState, useCallback, useMemo } from "react"
import { cn } from "~/lib/utils"
import { CheckCircle, List, Settings2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"
import TaskActionButton from "~/components/jarvis/tasks/task-action-button"
import TaskCreationForm from "~/components/jarvis/tasks/task-creation-form"
import AudioRecorderMobile from "~/components/jarvis/tasks/audio-recorder-mobile"
import VoiceIcon from "~/components/jarvis/tasks/voice-icon"
import type { TaskAction } from "~/lib/jarvis/task-utils"

export interface TaskQuickActionsCardMobileProps {
  onCreateTask?: () => void
  onNewList?: () => void
  onVoiceTasks?: () => void
  onSummarizeMeeting?: () => void
  className?: string
}

const TaskQuickActionsCardMobile = React.memo(({
  onCreateTask,
  onNewList,
  onVoiceTasks,
  onSummarizeMeeting,
  className,
}: TaskQuickActionsCardMobileProps) => {
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)

  const handleVoiceTasksClick = useCallback(() => {
    setShowAudioRecorder(prev => !prev)
    setShowCreateTask(false)
    onVoiceTasks?.()
  }, [onVoiceTasks])

  const handleCreateTaskClick = useCallback(() => {
    setShowCreateTask(prev => !prev)
    setShowAudioRecorder(false)
    onCreateTask?.()
  }, [onCreateTask])

  const handleTaskCreated = useCallback((title: string, assignee?: string, tags?: string[]) => {
    console.log("Task created:", { title, assignee, tags })
    // You can add additional logic here if needed
  }, [])

  const handleAudioRecordingComplete = useCallback((audioBlob: Blob) => {
    console.log("Audio recording completed:", audioBlob)
    // Handle the audio blob (e.g., send to server, transcribe, etc.)
  }, [])

  const actionItems: TaskAction[] = useMemo(() => [
    {
      id: "create",
      label: "Criar tarefa",
      description: "Use @ para atribuir ou # para adicionar uma etiqueta",
      icon: CheckCircle,
      action: handleCreateTaskClick,
      hasSubmitButton: false,
      isExpandable: true,
      isExpanded: showCreateTask,
    },
    { 
      id: "list", 
      label: "Nova lista", 
      icon: List, 
      action: onNewList 
    },
    {
      id: "voice",
      label: "Tarefas e notas por voz",
      icon: VoiceIcon,
      action: handleVoiceTasksClick,
      isExpandable: true,
      isExpanded: showAudioRecorder,
    },
    {
      id: "summarize",
      label: "Resumir uma reunião",
      icon: Settings2,
      action: onSummarizeMeeting,
    },
  ], [showCreateTask, showAudioRecorder, handleCreateTaskClick, handleVoiceTasksClick, onNewList, onSummarizeMeeting])

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className={cn("h-full rounded-xl px-5 pb-5 pt-5", className)}>
        <div className="pb-3">
          <h3 className="flex items-center gap-3 text-xl font-semibold text-white">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            Ações Rápidas
          </h3>
        </div>
        <div className="space-y-1">
          <AnimatePresence>
            {actionItems.map((item) => (
              <TaskActionButton
                key={item.id}
                action={item}
                isExpanded={item.isExpanded}
                onToggleExpand={
                  item.id === "create" ? handleCreateTaskClick : 
                  item.id === "voice" ? handleVoiceTasksClick : 
                  undefined
                }
              >
                {item.id === "create" && showCreateTask && (
                  <TaskCreationForm
                    onSubmit={handleTaskCreated}
                    onClose={() => setShowCreateTask(false)}
                  />
                )}
                {item.id === "voice" && showAudioRecorder && (
                  <AudioRecorderMobile
                    onRecordingComplete={handleAudioRecordingComplete}
                  />
                )}
              </TaskActionButton>
            ))}
          </AnimatePresence>
        </div>
      </LiquidGlassCard>
    </motion.div>
  )
})

TaskQuickActionsCardMobile.displayName = "TaskQuickActionsCardMobile"

export default TaskQuickActionsCardMobile