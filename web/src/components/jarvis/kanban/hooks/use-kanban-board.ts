"use client"

import { useState, useEffect } from "react"
import type { Task, Project, ActiveTabValue } from "../lib/types"
import { useKanbanStorageOptimized } from "./use-kanban-storage-optimized"
import { useKanbanTasks } from "./use-kanban-tasks"
import { useKanbanColumns } from "./use-kanban-columns"
import { useKanbanDragDrop } from "./use-kanban-drag-drop"

export function useKanbanBoard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [tasksByProject, setTasksByProject] = useState<{ [projectId: string]: Task[] }>({})
  const [activeTab, setActiveTab] = useState<ActiveTabValue>("projectList")

  // Storage operations
  const {
    loadProjects,
    loadTasks,
    loadLastActiveProject,
    loadLastActiveTab,
    saveProjects,
    saveTasks,
    saveLastActiveProject,
    saveLastActiveTab,
  } = useKanbanStorageOptimized()

  // Load initial data from localStorage
  useEffect(() => {
    const loadedProjects = loadProjects()
    setProjects(loadedProjects)

    const loadedTasks = loadTasks(loadedProjects)
    setTasksByProject(loadedTasks)

    const lastActiveProject = loadLastActiveProject(loadedProjects)
    const lastActiveTab = loadLastActiveTab()

    if (lastActiveProject) {
      setCurrentProject(lastActiveProject)
      setActiveTab(lastActiveTab || "kanbanBoard")
    } else if (loadedProjects.length > 0) {
      setCurrentProject(loadedProjects[0] ?? null)
      setActiveTab("kanbanBoard")
    } else {
      setActiveTab("projectList")
    }
  }, [loadProjects, loadTasks, loadLastActiveProject, loadLastActiveTab])

  // Save data to localStorage
  useEffect(() => {
    saveProjects(projects)
  }, [projects, saveProjects])

  useEffect(() => {
    saveTasks(tasksByProject)
  }, [tasksByProject, saveTasks])

  useEffect(() => {
    saveLastActiveProject(currentProject)
  }, [currentProject, saveLastActiveProject])

  useEffect(() => {
    saveLastActiveTab(activeTab)
  }, [activeTab, saveLastActiveTab])

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
    
    // Task hooks
    ...taskHooks,
    
    // Column hooks
    ...columnHooks,
    
    // Drag and drop hooks
    ...dragDropHooks,
  }
}