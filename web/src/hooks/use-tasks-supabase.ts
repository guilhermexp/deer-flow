"use client"

import { useState, useEffect, useCallback } from "react"

import type { Task as AppTask } from "~/components/jarvis/kanban/lib/types"
import { useAuth } from "~/core/contexts/auth-context"
import { projectsService } from "~/services/supabase/projects"

// Task interface para compatibilidade com useTasksApi
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  day: string;
  isRunning: boolean;
  isFavorite: boolean;
  timeSpent: number;
  category?: string;
  isCompleted?: boolean;
}

// Converter AppTask para Task local
function convertAppTaskToTask(appTask: AppTask): Task {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const today = days[new Date().getDay()] ?? "monday"
  
  return {
    id: appTask.id,
    title: appTask.title,
    description: appTask.description,
    priority: 'medium', // AppTask não tem prioridade, usar padrão
    day: today, // Todas as tarefas são do dia atual por enquanto
    isRunning: false,
    isFavorite: false,
    timeSpent: 0,
    category: 'other',
    isCompleted: appTask.status === 'done'
  }
}

// Converter Task local para updates de AppTask
function convertTaskToAppTaskUpdates(task: Partial<Task>): Partial<AppTask> {
  const updates: Partial<AppTask> = {}
  
  if (task.title !== undefined) updates.title = task.title
  if (task.description !== undefined) updates.description = task.description
  if (task.isCompleted !== undefined) {
    updates.status = task.isCompleted ? 'done' : 'not-started'
  }
  
  return updates
}

export function useTasksSupabase() {
  const [tasksByDay, setTasksByDay] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  
  const [currentDay, setCurrentDay] = useState<string>(() => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()] ?? "monday"
  })
  
  // Projeto padrão para tarefas diárias
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  
  // Garantir que existe um projeto padrão
  const ensureDefaultProject = useCallback(async () => {
    try {
      // Buscar projetos existentes
      const projects = await projectsService.getProjects()
      
      // Procurar projeto de tarefas diárias
      let dailyProject = projects.find(p => p.name === "Tarefas Diárias")
      
      if (!dailyProject) {
        // Criar projeto padrão se não existir
        dailyProject = await projectsService.createProject({
          name: "Tarefas Diárias",
          description: "Tarefas do dia a dia"
        })
      }
      
      setDefaultProjectId(dailyProject.id)
      return dailyProject.id
    } catch (err) {
      console.error("Erro ao garantir projeto padrão:", err)
      throw err
    }
  }, [])
  
  // Carregar tarefas
  const loadTasks = useCallback(async () => {
    if (!defaultProjectId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Buscar tarefas do projeto padrão
      const appTasks = await projectsService.getProjectTasks(defaultProjectId)
      
      // Converter para formato local
      const localTasks = appTasks.map(convertAppTaskToTask)
      
      setTasksByDay(localTasks)
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err)
      setError("Erro ao carregar tarefas")
    } finally {
      setIsLoading(false)
    }
  }, [defaultProjectId])
  
  // Inicializar ao montar
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      ensureDefaultProject().then(() => {
        loadTasks()
      })
    } else if (!isAuthLoading && !isAuthenticated) {
      setIsLoading(false)
    }
  }, [isAuthLoading, isAuthenticated, ensureDefaultProject, loadTasks])
  
  // Criar tarefa
  const createTask = useCallback(async (task: Partial<Task>) => {
    if (!defaultProjectId) {
      throw new Error("Projeto padrão não encontrado")
    }
    
    try {
      const appTaskData: Partial<AppTask> = {
        title: task.title || "Nova Tarefa",
        description: task.description,
        status: task.isCompleted ? 'done' : 'not-started'
      }
      
      const newAppTask = await projectsService.createTask(defaultProjectId, appTaskData)
      const newLocalTask = convertAppTaskToTask(newAppTask)
      
      setTasksByDay(prev => [...prev, newLocalTask])
      return newLocalTask
    } catch (err) {
      console.error("Erro ao criar tarefa:", err)
      throw err
    }
  }, [defaultProjectId])
  
  // Atualizar tarefa
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const appTaskUpdates = convertTaskToAppTaskUpdates(updates)
      const updatedAppTask = await projectsService.updateTask(taskId, appTaskUpdates)
      const updatedLocalTask = convertAppTaskToTask(updatedAppTask)
      
      setTasksByDay(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ))
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err)
      throw err
    }
  }, [])
  
  // Deletar tarefa
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await projectsService.deleteTask(taskId)
      setTasksByDay(prev => prev.filter(task => task.id !== taskId))
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err)
      throw err
    }
  }, [])
  
  // Atualizar estado local com sincronização automática
  const setTasksByDayWithSync = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasksByDay(prev => {
      const updated = updater(prev)
      
      // Sincronizar mudanças com o Supabase
      updated.forEach(async (task) => {
        const original = prev.find(t => t.id === task.id)
        if (original && JSON.stringify(original) !== JSON.stringify(task)) {
          try {
            await updateTask(task.id, task)
          } catch (err) {
            console.error("Erro ao sincronizar tarefa:", err)
          }
        }
      })
      
      return updated
    })
  }, [updateTask])
  
  return {
    tasksByDay,
    setTasksByDay: setTasksByDayWithSync,
    currentDay,
    setCurrentDay,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reloadTasks: loadTasks
  }
}