"use client"

import { useCallback, useRef, useEffect } from "react"
import type { Task, Project, ActiveTabValue } from "../lib/types"

export const PROJECTS_STORAGE_KEY = "kanban-projects-v2"
export const TASKS_BY_PROJECT_STORAGE_KEY = "kanban-tasksByProject-v2"
export const LAST_ACTIVE_PROJECT_KEY = "kanban-lastActiveProject-v2"
export const LAST_ACTIVE_TAB_KEY = "kanban-lastActiveTab-v2"

export const initialDefaultProject: Project = {
  id: "default-project-1",
  name: "Meu Primeiro Projeto",
  description: "Um projeto de exemplo para começar a organizar suas tarefas.",
  createdAt: new Date().toISOString(),
  isPriority: false,
}

export const initialTasksData: Task[] = [
  {
    id: "task-1",
    projectId: "default-project-1",
    title: "Apresentar produto e coletar feedback",
    date: "22 Mai 12:01",
    progress: 0,
    comments: 0,
    attachments: 1,
    assignees: [{ name: "João Silva", initials: "JS" }],
    status: "not-started",
    weekDay: "quarta",
    description: "Preparar apresentação do produto.",
  },
  {
    id: "task-2",
    projectId: "default-project-1",
    title: "Agendar treinamento de vendas",
    date: "17 Mai 20:00",
    progress: 61,
    comments: 3,
    attachments: 1,
    assignees: [{ name: "Maria Oliveira", initials: "MO" }],
    status: "paused",
    weekDay: "segunda",
    description: "Organizar treinamento para a equipe.",
  },
  {
    id: "task-3",
    projectId: "default-project-1",
    title: "Revisar orçamento de marketing",
    date: "24 Mai 18:40",
    progress: 75,
    comments: 5,
    attachments: 0,
    assignees: [{ name: "Carlos Pereira", initials: "CP" }],
    status: "in-progress",
    weekDay: "sexta",
    description: "Analisar o orçamento trimestral.",
  },
  {
    id: "task-4",
    projectId: "default-project-1",
    title: "Apresentação finalizada",
    date: "18 Mai 09:00",
    progress: 100,
    comments: 5,
    attachments: 0,
    assignees: [{ name: "Ana Costa", initials: "AC" }],
    status: "done",
    weekDay: "terca",
    description: "Slides da apresentação concluídos.",
  },
]

export function useKanbanStorageOptimized() {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load projects from localStorage - now with caching
  const loadProjects = useCallback((): Project[] => {
    try {
      const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY)
      if (storedProjects) {
        return JSON.parse(storedProjects)
      }
    } catch (e) {
      console.error("Error loading projects from localStorage:", e)
    }
    
    // Initialize with default project if none exist
    const defaultProjects = [initialDefaultProject]
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(defaultProjects))
    return defaultProjects
  }, [])

  // Load tasks from localStorage - now with caching
  const loadTasks = useCallback((projects: Project[]): { [projectId: string]: Task[] } => {
    try {
      const storedTasks = localStorage.getItem(TASKS_BY_PROJECT_STORAGE_KEY)
      if (storedTasks) {
        return JSON.parse(storedTasks)
      }
    } catch (e) {
      console.error("Error loading tasks from localStorage:", e)
    }
    
    // Initialize with default tasks if none exist
    const defaultTasks = { [initialDefaultProject.id]: initialTasksData }
    localStorage.setItem(TASKS_BY_PROJECT_STORAGE_KEY, JSON.stringify(defaultTasks))
    return defaultTasks
  }, [])

  // Load last active project
  const loadLastActiveProject = useCallback((projects: Project[]): Project | null => {
    try {
      const storedProjectId = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY)
      if (storedProjectId) {
        // Handle both JSON and plain string formats
        let projectId: string;
        try {
          projectId = JSON.parse(storedProjectId)
        } catch {
          // If it's not JSON, use it as is
          projectId = storedProjectId
        }
        return projects.find(p => p.id === projectId) || projects[0] || null
      }
    } catch (e) {
      console.error("Error loading last active project:", e)
    }
    return projects[0] || null
  }, [])

  // Load last active tab
  const loadLastActiveTab = useCallback((): ActiveTabValue => {
    try {
      const storedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY)
      if (storedTab) {
        // Handle both JSON and plain string formats
        try {
          return JSON.parse(storedTab) as ActiveTabValue
        } catch {
          // If it's not JSON, use it as is
          return storedTab as ActiveTabValue
        }
      }
    } catch (e) {
      console.error("Error loading last active tab:", e)
    }
    return "projectList"
  }, [])

  // Save methods with debouncing
  const saveWithDebounce = useCallback((key: string, data: any, delay = 500) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          localStorage.setItem(key, JSON.stringify(data))
        } catch (e) {
          console.error(`Error saving ${key}:`, e)
        }
      })
    }, delay)
  }, [])

  const saveProjects = useCallback((projects: Project[]) => {
    saveWithDebounce(PROJECTS_STORAGE_KEY, projects)
  }, [saveWithDebounce])

  const saveTasks = useCallback((tasks: { [projectId: string]: Task[] }) => {
    saveWithDebounce(TASKS_BY_PROJECT_STORAGE_KEY, tasks)
  }, [saveWithDebounce])

  const saveLastActiveProject = useCallback((project: Project | null) => {
    if (project) {
      saveWithDebounce(LAST_ACTIVE_PROJECT_KEY, project.id, 100) // Faster save for UI state
    }
  }, [saveWithDebounce])

  const saveLastActiveTab = useCallback((tab: ActiveTabValue) => {
    saveWithDebounce(LAST_ACTIVE_TAB_KEY, tab, 100) // Faster save for UI state
  }, [saveWithDebounce])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    loadProjects,
    loadTasks,
    loadLastActiveProject,
    loadLastActiveTab,
    saveProjects,
    saveTasks,
    saveLastActiveProject,
    saveLastActiveTab,
  }
}