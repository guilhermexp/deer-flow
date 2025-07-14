import type { Task, Project, TaskStatus, TaskWeekDay, Assignee } from "~/components/jarvis/kanban/lib/types"

/**
 * Creates a new project with default values
 */
export function createProject(name: string, description: string): Project {
  return {
    id: `project-${Date.now().toString()}`,
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    isPriority: false,
  }
}

/**
 * Creates a new task with default values
 */
export function createTask(
  projectId: string,
  title: string,
  description: string,
  status: TaskStatus,
  weekDay?: TaskWeekDay,
  existingTask?: Task
): Task {
  const now = new Date()
  const formattedDate = `${now.getDate().toString().padStart(2, "0")} ${now
    .toLocaleString("pt-BR", { month: "short" })
    .replace(".", "")} ${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`

  return {
    id: existingTask?.id || `task-${Date.now().toString()}`,
    projectId,
    title: title.trim(),
    description: description.trim(),
    date: formattedDate,
    progress: existingTask?.progress || 0,
    comments: existingTask?.comments || 0,
    attachments: existingTask?.attachments || 0,
    assignees: existingTask?.assignees || [],
    status,
    weekDay: weekDay === "none" ? undefined : weekDay,
  }
}

/**
 * Formats a date for task display
 */
export function formatTaskDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })
    .replace(" de ", " ")
    .replace(".", "")
}

/**
 * Updates a task in the tasks array
 */
export function updateTaskInList(tasks: Task[], updatedTask: Task): Task[] {
  return tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
}

/**
 * Removes a task from the tasks array
 */
export function removeTaskFromList(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.id !== taskId)
}

/**
 * Filters tasks by search query
 */
export function filterTasksByQuery(tasks: Task[], query: string): Task[] {
  const lowerQuery = query.toLowerCase()
  return tasks.filter((task) => task.title.toLowerCase().includes(lowerQuery))
}

/**
 * Toggles project priority
 */
export function toggleProjectPriorityInList(projects: Project[], projectId: string): Project[] {
  return projects.map((project) =>
    project.id === projectId ? { ...project, isPriority: !project.isPriority } : project
  )
}

/**
 * Creates a random assignee from predefined list
 */
export function createRandomAssignee(): Assignee {
  const names = [
    "João Silva",
    "Maria Oliveira",
    "Carlos Pereira",
    "Ana Costa",
    "Pedro Santos",
    "Sofia Almeida",
  ]
  const randomName = names[Math.floor(Math.random() * names.length)] ?? "Unknown"
  const initials = randomName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  return { name: randomName, initials }
}

/**
 * Default task form data
 */
export function getDefaultTaskFormData() {
  return {
    title: "",
    description: "",
    date: "",
    progress: [0],
    assignees: [] as Assignee[],
    status: "not-started" as TaskStatus,
    weekDay: "none" as TaskWeekDay | "none",
  }
}

/**
 * Default project form data
 */
export function getDefaultProjectFormData() {
  return {
    name: "",
    description: "",
  }
}