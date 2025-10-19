"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { CornerDownLeft } from "lucide-react";
import type { TaskAction } from "~/lib/jarvis/task-utils";

export interface TaskActionButtonProps {
  action: TaskAction;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}

const TaskActionButton = React.memo(
  ({
    action,
    isExpanded = false,
    onToggleExpand,
    children,
  }: TaskActionButtonProps) => {
    const IconComponent = action.icon;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (action.isExpandable && onToggleExpand) {
        onToggleExpand();
      } else if (action.action) {
        action.action();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (action.isExpandable && onToggleExpand) {
          onToggleExpand();
        } else if (action.action) {
          action.action();
        }
      }
    };

    const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      action.action?.();
    };

    return (
      <motion.div
        className={cn(
          "cursor-pointer rounded-lg transition-colors duration-200",
          isExpanded ? "p-3" : "hover:bg-muted/20 p-3"
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={action.label}
        aria-expanded={action.isExpandable ? isExpanded : undefined}
      >
        <div
          className={cn(
            "flex items-center",
            action.hasSubmitButton ? "justify-between" : "gap-3"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex-shrink-0">
              {React.isValidElement(IconComponent) ? (
                IconComponent
              ) : typeof IconComponent === "function" ? (
                <IconComponent
                  className={cn(
                    "h-5 w-5",
                    action.id === "create" || action.id === "list"
                      ? "text-accent-red"
                      : "text-muted-foreground"
                  )}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {action.label}
              </p>
              {action.description && !isExpanded && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {action.description}
                </p>
              )}
            </div>
          </div>
          {action.hasSubmitButton && (
            <Button
              variant="ghost"
              size="icon"
              className="border-border hover:bg-muted/40 text-muted-foreground h-8 w-8 flex-shrink-0 bg-transparent"
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
    );
  }
);

TaskActionButton.displayName = "TaskActionButton";

export default TaskActionButton;
