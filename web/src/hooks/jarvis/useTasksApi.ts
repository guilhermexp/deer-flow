// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client"
import { useState, useEffect, useCallback } from "react"
import { dashboardApi } from "~/core/api/dashboard"
import type { Task as ApiTask } from "~/core/api/client"
// Define Task type locally
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

// Convert API task to local task format
function convertApiTaskToLocal(apiTask: ApiTask): Task {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const today = days[new Date().getDay()] ?? "monday"
  
  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    description: apiTask.description || "",
    category: apiTask.category || "other",
    isCompleted: apiTask.status === "done",
    isFavorite: false, // Not stored in API yet
    timeSpent: 0, // Not stored in API yet
    isRunning: false, // Not stored in API yet
    day: today, // All tasks are today for now
    priority: apiTask.priority || "medium"
  }
}

// Convert local task to API format
function convertLocalTaskToApi(task: Task): any {
  return {
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.isCompleted ? "done" : "todo",
    priority: task.priority || "medium"
  }
}

export function useTasksApi() {
  const [tasksByDay, setTasksByDay] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentDay, setCurrentDay] = useState<string>(() => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()] ?? "monday"
  })

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const apiTasks = await dashboardApi.getTasks({ limit: 100 })
      const localTasks = apiTasks.map(convertApiTaskToLocal)
      setTasksByDay(localTasks)
    } catch (err) {
      console.error("Failed to load tasks:", err)
      setError("Failed to load tasks")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Create task
  const createTask = useCallback(async (task: Partial<Task>) => {
    try {
      const apiTask = await dashboardApi.createTask({
        title: task.title || "New Task",
        description: task.description,
        category: task.category,
        priority: task.priority || "medium"
      })
      const localTask = convertApiTaskToLocal(apiTask)
      setTasksByDay(prev => [...prev, localTask])
      return localTask
    } catch (err) {
      console.error("Failed to create task:", err)
      throw err
    }
  }, [])

  // Update task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const id = parseInt(taskId)
      const apiUpdates: any = {}
      
      if (updates.title !== undefined) apiUpdates.title = updates.title
      if (updates.description !== undefined) apiUpdates.description = updates.description
      if (updates.category !== undefined) apiUpdates.category = updates.category
      if (updates.priority !== undefined) apiUpdates.priority = updates.priority
      if (updates.isCompleted !== undefined) {
        apiUpdates.status = updates.isCompleted ? "done" : "todo"
        if (updates.isCompleted) {
          apiUpdates.completed_at = new Date().toISOString()
        }
      }
      
      const apiTask = await dashboardApi.updateTask(id, apiUpdates)
      const localTask = convertApiTaskToLocal(apiTask)
      
      setTasksByDay(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...localTask, ...updates } : task
      ))
    } catch (err) {
      console.error("Failed to update task:", err)
      throw err
    }
  }, [])

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const id = parseInt(taskId)
      await dashboardApi.deleteTask(id)
      setTasksByDay(prev => prev.filter(task => task.id !== taskId))
    } catch (err) {
      console.error("Failed to delete task:", err)
      throw err
    }
  }, [])

  // Override setTasksByDay to handle local updates
  const setTasksByDayWithApi = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasksByDay(prev => {
      const updated = updater(prev)
      
      // Find changed tasks and update them via API
      updated.forEach(async (task) => {
        const original = prev.find(t => t.id === task.id)
        if (original && JSON.stringify(original) !== JSON.stringify(task)) {
          // Task was updated locally, sync with API
          try {
            await updateTask(task.id, task)
          } catch (err) {
            // Revert on error
            console.error("Failed to sync task update:", err)
          }
        }
      })
      
      return updated
    })
  }, [updateTask])

  return { 
    tasksByDay, 
    setTasksByDay: setTasksByDayWithApi, 
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