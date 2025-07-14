"use client"

import { useState, useEffect } from "react"
import type { Task, Project, ActiveTabValue } from "../lib/types"
import { useKanbanStorageAsync } from "./use-kanban-storage-async"
import { useKanbanTasks } from "./use-kanban-tasks"
import { useKanbanColumns } from "./use-kanban-columns"
import { useKanbanDragDrop } from "./use-kanban-drag-drop"

export function useKanbanBoardAsync() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [tasksByProject, setTasksByProject] = useState<{ [projectId: string]: Task[] }>({})
  const [activeTab, setActiveTab] = useState<ActiveTabValue>("projectList")

  // Async storage operations
  const {
    projects: storedProjects,
    tasksByProject: storedTasks,
    currentProject: storedCurrentProject,
    lastActiveTab: storedActiveTab,
    loading,
    saveProjects,
    saveTasks,
    saveLastActiveProject,
    saveLastActiveTab,
  } = useKanbanStorageAsync()

  // Initialize state from async storage when loaded
  useEffect(() => {
    if (!loading) {
      setProjects(storedProjects)
      setTasksByProject(storedTasks)
      setCurrentProject(storedCurrentProject)
      setActiveTab(storedActiveTab)
    }
  }, [loading, storedProjects, storedTasks, storedCurrentProject, storedActiveTab])

  // Save data to async storage when changed
  useEffect(() => {
    if (!loading) {
      saveProjects(projects)
    }
  }, [projects, saveProjects, loading])

  useEffect(() => {
    if (!loading) {
      saveTasks(tasksByProject)
    }
  }, [tasksByProject, saveTasks, loading])

  useEffect(() => {
    if (!loading) {
      saveLastActiveProject(currentProject)
    }
  }, [currentProject, saveLastActiveProject, loading])

  useEffect(() => {
    if (!loading) {
      saveLastActiveTab(activeTab)
    }
  }, [activeTab, saveLastActiveTab, loading])

  // Task management
  const taskHooks = useKanbanTasks(currentProject, tasksByProject, setTasksByProject)

  // Column/Project management
  const columnHooks = useKanbanColumns(
    projects,
    setProjects,
    setTasksByProject,
    setCurrentProject,
    setActiveTab
  )

  // Drag and drop
  const dragDropHooks = useKanbanDragDrop(taskHooks.handleUpdateTask)

  return {
    // State
    projects,
    currentProject,
    tasksByProject,
    activeTab,
    setActiveTab,
    loading,
    
    // Task hooks
    ...taskHooks,
    
    // Column hooks
    ...columnHooks,
    
    // Drag and drop hooks
    ...dragDropHooks,
  }
}