"use client"
import React from "react"
import { motion } from "framer-motion"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { CornerDownLeft } from "lucide-react"
import type { TaskAction } from "~/lib/jarvis/task-utils"

export interface TaskActionButtonProps {
  action: TaskAction
  isExpanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

const TaskActionButton = React.memo(({ 
  action, 
  isExpanded = false,
  onToggleExpand,
  children 
}: TaskActionButtonProps) => {
  const IconComponent = action.icon
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (action.isExpandable && onToggleExpand) {
      onToggleExpand()
    } else if (action.action) {
      action.action()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (action.isExpandable && onToggleExpand) {
        onToggleExpand()
      } else if (action.action) {
        action.action()
      }
    }
  }

  const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    action.action?.()
  }

  return (
    <motion.div
      className={cn(
        "rounded-lg cursor-pointer transition-colors duration-200",
        isExpanded ? "p-3" : "p-3 hover:bg-muted/20"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={action.label}
      aria-expanded={action.isExpandable ? isExpanded : undefined}
    >
      <div className={cn("flex items-center", action.hasSubmitButton ? "justify-between" : "gap-3")}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {React.isValidElement(IconComponent) ? (
              IconComponent
            ) : typeof IconComponent === 'function' ? (
              <IconComponent
                className={cn(
                  "w-5 h-5",
                  action.id === "create" || action.id === "list" ? "text-accent-red" : "text-muted-foreground"
                )}
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium text-sm truncate">{action.label}</p>
            {action.description && !isExpanded && (
              <p className="text-muted-foreground text-xs truncate mt-0.5">{action.description}</p>
            )}
          </div>
        </div>
        {action.hasSubmitButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-border bg-transparent hover:bg-muted/40 text-muted-foreground flex-shrink-0"
            onClick={handleSubmitClick}
            aria-label="Enviar tarefa"
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      {action.isExpandable && isExpanded && children && (
        <motion.div
          key="expandedContent"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 16 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
})

TaskActionButton.displayName = "TaskActionButton"

export default TaskActionButton