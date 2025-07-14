import type React from "react"

export interface Assignee {
  name: string
  avatar?: string
  initials: string
}

export type TaskStatus = "not-started" | "paused" | "in-progress" | "done"
export type TaskWeekDay =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo"
  | "none"
  | undefined

export interface Task {
  id: string
  projectId: string
  title: string
  date: string // Consider using ISOString for consistency if parsing/formatting
  progress: number
  comments: number
  attachments: number
  assignees: Assignee[]
  status: TaskStatus
  weekDay?: TaskWeekDay
  description?: string
}

export interface ColumnDefinition {
  id: string
  title: string
  status: TaskStatus // For standard Kanban columns
  icon: React.ComponentType<{ className?: string }>
  color: string
  progressColor: string
}

export interface Column extends ColumnDefinition {
  tasks: Task[]
}

export interface WeekDayColumnDefinition {
  id: TaskWeekDay
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  progressColor: string
}

export interface WeekDayColumn extends WeekDayColumnDefinition {
  tasks: Task[]
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string // ISOString recommended
  isPriority?: boolean
}

export type ActiveTabValue = "projectList" | "kanbanBoard" | "weekBoard"
