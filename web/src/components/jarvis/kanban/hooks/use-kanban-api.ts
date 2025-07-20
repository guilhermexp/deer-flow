"use client"

import { useState, useEffect, useCallback } from "react"
import { projectsApi, type Project as ApiProject, type KanbanBoard } from "~/core/api/projects"
import { useAuth } from "~/core/contexts/auth-context"
import type { Task, Project, ActiveTabValue, TaskStatus } from "../lib/types"

// Map API types to Kanban types
function mapApiProjectToKanbanProject(apiProject: ApiProject): Project {
  return {
    id: String(apiProject.id),
    name: apiProject.name,
    description: apiProject.description,
    createdAt: apiProject.created_at,
    isPriority: false, // This can be extended based on API
  }
}

function mapKanbanProjectToApiProject(kanbanProject: Partial<Project>) {
  return {
    name: kanbanProject.name || "",
    description: kanbanProject.description,
    color: "#3B82F6",
    icon: "folder",
    status: "active",
  }
}

function mapApiTaskToKanbanTask(apiTask: any): Task {
  // Map backend task to frontend task format
  const statusMap: { [key: string]: TaskStatus } = {
    'TODO': 'not-started',
    'IN_PROGRESS': 'in-progress', 
    'DONE': 'done',
  }

  return {
    id: String(apiTask.id),
    projectId: String(apiTask.project_id || ''),
    title: apiTask.title,
    date: new Date(apiTask.created_at).toLocaleDateString('pt-BR'),
    progress: apiTask.status === 'DONE' ? 100 : (apiTask.status === 'IN_PROGRESS' ? 50 : 0),
    comments: 0, // This can be extended
    attachments: 0, // This can be extended
    assignees: [], // This can be extended
    status: statusMap[apiTask.status] || 'not-started',
    weekDay: 'none',
    description: apiTask.description,
  }
}

export function useKanbanApi() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasksByProject, setTasksByProject] = useState<{ [projectId: string]: Task[] }>({})
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTabValue>("projectList")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, isAuthenticated } = useAuth()

  // Load projects from API
  const loadProjects = useCallback(async (): Promise<Project[]> => {
    if (!isAuthenticated) {
      return []
    }

    try {
      setLoading(true)
      setError(null)
      const apiProjects = await projectsApi.getProjects()
      const kanbanProjects = apiProjects.map(mapApiProjectToKanbanProject)
      setProjects(kanbanProjects)
      return kanbanProjects
    } catch (err) {
      console.error("Error loading projects:", err)
      setError("Erro ao carregar projetos")
      return []
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Load tasks for a specific project
  const loadProjectTasks = useCallback(async (projectId: string): Promise<Task[]> => {
    if (!isAuthenticated || !projectId) {
      return []
    }

    try {
      const kanbanBoard = await projectsApi.getKanbanBoard(Number(projectId))
      const tasks: Task[] = []
      
      // Extract tasks from all columns
      kanbanBoard.columns.forEach(column => {
        column.tasks.forEach(apiTask => {
          tasks.push(mapApiTaskToKanbanTask(apiTask))
        })
      })

      setTasksByProject(prev => ({
        ...prev,
        [projectId]: tasks
      }))

      return tasks
    } catch (err) {
      console.error("Error loading project tasks:", err)
      setError("Erro ao carregar tarefas do projeto")
      return []
    }
  }, [isAuthenticated])

  // Create new project
  const createProject = useCallback(async (projectData: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      setLoading(true)
      const apiProjectData = mapKanbanProjectToApiProject(projectData)
      const newApiProject = await projectsApi.createProject(apiProjectData)
      const newKanbanProject = mapApiProjectToKanbanProject(newApiProject)
      
      setProjects(prev => [...prev, newKanbanProject])
      return newKanbanProject
    } catch (err) {
      console.error("Error creating project:", err)
      setError("Erro ao criar projeto")
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Update project
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      const updateData = mapKanbanProjectToApiProject(updates)
      const updatedApiProject = await projectsApi.updateProject(Number(projectId), updateData)
      const updatedKanbanProject = mapApiProjectToKanbanProject(updatedApiProject)
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedKanbanProject : p)
      )
      
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedKanbanProject)
      }
      
      return updatedKanbanProject
    } catch (err) {
      console.error("Error updating project:", err)
      setError("Erro ao atualizar projeto")
      throw err
    }
  }, [isAuthenticated, currentProject])

  // Delete project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      await projectsApi.deleteProject(Number(projectId))
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setTasksByProject(prev => {
        const newTasks = { ...prev }
        delete newTasks[projectId]
        return newTasks
      })
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
        setActiveTab("projectList")
      }
    } catch (err) {
      console.error("Error deleting project:", err)
      setError("Erro ao deletar projeto")
      throw err
    }
  }, [isAuthenticated, currentProject])

  // Create task in project
  const createTask = useCallback(async (projectId: string, taskData: Partial<Task>, columnId: string = 'backlog'): Promise<Task | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      const apiTaskData = {
        title: taskData.title || "",
        description: taskData.description,
        priority: 'medium' as const,
      }
      
      const newApiTask = await projectsApi.createKanbanTask(Number(projectId), apiTaskData, columnId)
      const newKanbanTask = mapApiTaskToKanbanTask({
        ...newApiTask,
        project_id: Number(projectId)
      })
      
      setTasksByProject(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newKanbanTask]
      }))
      
      return newKanbanTask
    } catch (err) {
      console.error("Error creating task:", err)
      setError("Erro ao criar tarefa")
      throw err
    }
  }, [isAuthenticated])

  // Move task between columns
  const moveTask = useCallback(async (projectId: string, taskId: string, columnId: string, order: number): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      await projectsApi.moveKanbanTask(Number(projectId), Number(taskId), {
        column_id: columnId,
        order: order
      })
      
      // Update local state
      setTasksByProject(prev => {
        const projectTasks = prev[projectId] || []
        const updatedTasks = projectTasks.map(task => {
          if (task.id === taskId) {
            const statusMap: { [key: string]: TaskStatus } = {
              'backlog': 'not-started',
              'todo': 'not-started',
              'in_progress': 'in-progress',
              'done': 'done',
            }
            return {
              ...task,
              status: statusMap[columnId] || 'not-started',
              progress: columnId === 'done' ? 100 : (columnId === 'in_progress' ? 50 : 0)
            }
          }
          return task
        })
        
        return {
          ...prev,
          [projectId]: updatedTasks
        }
      })
    } catch (err) {
      console.error("Error moving task:", err)
      setError("Erro ao mover tarefa")
      throw err
    }
  }, [isAuthenticated])

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects().then(loadedProjects => {
        if (loadedProjects.length > 0 && !currentProject) {
          const firstProject = loadedProjects[0]
          if (firstProject) {
            setCurrentProject(firstProject)
            setActiveTab("kanbanBoard")
            loadProjectTasks(firstProject.id)
          }
        }
      })
    }
  }, [isAuthenticated, user, loadProjects, loadProjectTasks, currentProject])

  // Load tasks when current project changes
  useEffect(() => {
    if (currentProject && isAuthenticated) {
      loadProjectTasks(currentProject.id)
    }
  }, [currentProject, isAuthenticated, loadProjectTasks])

  return {
    // State
    projects,
    tasksByProject,
    currentProject,
    activeTab,
    loading,
    error,
    
    // Setters
    setProjects,
    setTasksByProject,
    setCurrentProject,
    setActiveTab,
    
    // API methods
    loadProjects,
    loadProjectTasks,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    moveTask,
    
    // Utils
    isAuthenticated,
  }
} 