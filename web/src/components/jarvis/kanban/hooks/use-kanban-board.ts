"use client"

import { useState } from "react"
import type { Task, Project, ActiveTabValue, TaskStatus } from "../lib/types"
import { useKanbanApi } from "./use-kanban-api"
import { useKanbanTasks } from "./use-kanban-tasks"
import { useKanbanColumns } from "./use-kanban-columns"
import { useKanbanDragDrop } from "./use-kanban-drag-drop"

export function useKanbanBoard() {
  // Use the new API hook instead of localStorage
  const {
    projects,
    tasksByProject,
    currentProject,
    activeTab,
    loading,
    error,
    setProjects,
    setTasksByProject,
    setCurrentProject,
    setActiveTab,
    loadProjects,
    createProject: apiCreateProject,
    updateProject: apiUpdateProject,
    deleteProject: apiDeleteProject,
    createTask: apiCreateTask,
    moveTask: apiMoveTask,
    isAuthenticated
  } = useKanbanApi()

  // Task management - use original signature
  const taskHooks = useKanbanTasks(
    currentProject, 
    tasksByProject, 
    setTasksByProject
  )

  // Column/Project management - use original signature
  const columnHooks = useKanbanColumns(
    projects,
    setProjects,
    setTasksByProject,
    setCurrentProject,
    setActiveTab
  )

  // Drag and drop
  const dragDropHooks = useKanbanDragDrop(taskHooks.handleUpdateTask)

  // Override methods that need API integration
  const handleSaveNewProject = async () => {
    if (!columnHooks.newProjectFormData.name.trim()) return
    
    try {
      const newProject = await apiCreateProject({
        name: columnHooks.newProjectFormData.name,
        description: columnHooks.newProjectFormData.description
      })
      
      if (newProject) {
        setCurrentProject(newProject)
        setActiveTab("kanbanBoard")
        columnHooks.setIsCreateProjectDialogOpen(false)
        columnHooks.setNewProjectFormData({ name: "", description: "" })
      }
    } catch (error) {
      console.error("Error creating project:", error)
    }
  }

  const handleAddTaskToColumn = async (columnId: string, title: string) => {
    if (!currentProject || !title.trim()) return
    
    try {
      await apiCreateTask(currentProject.id, { title }, columnId)
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!currentProject) return
    
    // Handle status changes that require API calls
    const originalTasks = tasksByProject[currentProject.id] || []
    const originalTask = originalTasks.find(t => t.id === updatedTask.id)
    
    if (originalTask && originalTask.status !== updatedTask.status) {
      const columnMap: { [key in TaskStatus]: string } = {
        'not-started': 'backlog',
        'in-progress': 'in_progress',
        'done': 'done',
        'paused': 'todo'
      }
      
      try {
        const columnId = columnMap[updatedTask.status]
        await apiMoveTask(currentProject.id, updatedTask.id, columnId, 0)
      } catch (error) {
        console.error("Error moving task:", error)
      }
    }
    
    // Also update local state
    taskHooks.handleUpdateTask(updatedTask)
  }

  return {
    // State
    projects,
    currentProject,
    tasksByProject,
    activeTab,
    setActiveTab,
    loading,
    error,
    isAuthenticated,
    
    // Task hooks (with API overrides)
    ...taskHooks,
    handleUpdateTask,
    handleAddTaskToColumn,
    
    // Column hooks (with API overrides)
    ...columnHooks,
    handleSaveNewProject,
    
    // Drag and drop hooks
    ...dragDropHooks,
    
    // API methods
    loadProjects,
    createProject: apiCreateProject,
    updateProject: apiUpdateProject,
    deleteProject: apiDeleteProject,
  }
}