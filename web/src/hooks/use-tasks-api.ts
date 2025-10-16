"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createTasksApiService } from "~/services/api/tasks"
import { useAuthenticatedApi } from "~/hooks/use-authenticated-api"
import { TaskStatus, TaskPriority, type KanbanTask } from "~/services/api/projects"

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  category?: string | null
  due_date?: string | null
  created_at?: string
  updated_at?: string
  project_id?: number
  order?: number
}

export const useTasksApi = (projectId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Use authenticated API client
  const authApi = useAuthenticatedApi()
  const tasksApiService = useMemo(() => createTasksApiService(authApi), [authApi])

  const loadTasks = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      // Note: We would need to implement a list method in the API service
      // For now, returning empty array
      setTasks([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId, tasksApiService])

  const addTask = useCallback(async (newTask: Omit<Task, 'id'>) => {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    try {
      const apiData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        category: newTask.category,
        due_date: newTask.due_date
      }
      const result = await tasksApiService.create(projectId, apiData, newTask.status)
      const convertedResult: Task = {
        id: result.id.toString(),
        title: result.title,
        description: result.description,
        status: TaskStatus.TODO, // Default status since it's not in KanbanTask
        priority: result.priority,
        category: null,
        due_date: null,
        created_at: result.created_at,
        updated_at: result.created_at, // Use created_at as fallback
        project_id: projectId,
        order: result.order
      }
      setTasks(prev => [...prev, convertedResult])
      return convertedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [projectId, tasksApiService])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    try {
      // For now, we'll just update the local state
      // Move functionality would need to be implemented
      if (updates.status) {
        await tasksApiService.move(projectId, parseInt(id), {
          column_id: updates.status,
          order: 0
        })
      }
      
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [projectId, tasksApiService])

  const deleteTask = useCallback(async (id: string) => {
    // Note: Delete functionality would need to be implemented in the API
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return { 
    tasks, 
    addTask, 
    updateTask,
    deleteTask,
    loading, 
    error,
    isAuthenticated,
    reloadTasks: loadTasks 
  }
}
