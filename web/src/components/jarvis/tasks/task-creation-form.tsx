"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { CornerDownLeft, X } from "lucide-react"
import { cn } from "~/lib/utils"
import { parseTaskInput, taskStorage } from "~/lib/jarvis/task-utils"

export interface TaskCreationFormProps {
  onSubmit?: (title: string, assignee?: string, tags?: string[]) => void
  onClose?: () => void
  className?: string
  autoFocus?: boolean
}

const TaskCreationForm = React.memo(({ 
  onSubmit, 
  onClose,
  className,
  autoFocus = true
}: TaskCreationFormProps) => {
  const [taskInput, setTaskInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!taskInput.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const { title, assignee, tags } = parseTaskInput(taskInput)
      
      if (title) {
        // Save task to storage
        taskStorage.addTask({
          title,
          assignee,
          tags,
          completed: false,
        })
        
        // Call parent callback if provided
        onSubmit?.(title, assignee, tags)
        
        // Reset form
        setTaskInput("")
        
        // Keep focus on input for quick consecutive task creation
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Escape" && onClose) {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className={cn("space-y-3", className)}
    >
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua tarefa... Use @ para atribuir ou # para tags"
          className="pr-20 bg-background/50 border-border/50 focus:border-primary/50"
          disabled={isSubmitting}
          aria-label="Nova tarefa"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {taskInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setTaskInput("")}
              disabled={isSubmitting}
              aria-label="Limpar"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!taskInput.trim() || isSubmitting}
            aria-label="Criar tarefa"
          >
            <CornerDownLeft className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Preview of parsed task */}
      {taskInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs text-muted-foreground space-y-1 px-2"
        >
          {(() => {
            const { title, assignee, tags } = parseTaskInput(taskInput)
            return (
              <>
                {title && <p>Tarefa: {title}</p>}
                {assignee && <p>Atribuir para: @{assignee}</p>}
                {tags && tags.length > 0 && (
                  <p>Tags: {tags.map(tag => `#${tag}`).join(", ")}</p>
                )}
              </>
            )
          })()}
        </motion.div>
      )}
    </motion.form>
  )
})

TaskCreationForm.displayName = "TaskCreationForm"

export default TaskCreationForm