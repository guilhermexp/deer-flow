"use client"

import { useState, useCallback } from "react"
import type { Project, ActiveTabValue } from "../lib/types"
import { createProject, toggleProjectPriorityInList, getDefaultProjectFormData } from "~/lib/kanban-operations"
import type { Task } from "../lib/types"

export function useKanbanColumns(
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setTasksByProject: React.Dispatch<React.SetStateAction<{ [projectId: string]: Task[] }>>,
  setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTabValue>>
) {
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const [newProjectFormData, setNewProjectFormData] = useState(getDefaultProjectFormData())

  const handleSaveNewProject = useCallback(() => {
    if (!newProjectFormData.name.trim()) return
    
    const newProject = createProject(newProjectFormData.name, newProjectFormData.description)
    
    setProjects((prev) => [...prev, newProject])
    setTasksByProject((prev) => ({ ...prev, [newProject.id]: [] }))
    setCurrentProject(newProject)
    setActiveTab("kanbanBoard")
    setIsCreateProjectDialogOpen(false)
    setNewProjectFormData(getDefaultProjectFormData())
  }, [newProjectFormData, setProjects, setTasksByProject, setCurrentProject, setActiveTab])

  const handleSelectProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId)
      if (project) {
        setCurrentProject(project)
        setActiveTab("kanbanBoard")
      }
    },
    [projects, setCurrentProject, setActiveTab]
  )

  const toggleProjectPriority = useCallback(
    (projectId: string) => {
      setProjects((prev) => toggleProjectPriorityInList(prev, projectId))
      
      // Update current project if it's the same
      setCurrentProject((prev) =>
        prev && prev.id === projectId
          ? { ...prev, isPriority: !prev.isPriority }
          : prev
      )
    },
    [setProjects, setCurrentProject]
  )

  return {
    isCreateProjectDialogOpen,
    setIsCreateProjectDialogOpen,
    newProjectFormData,
    setNewProjectFormData,
    handleSaveNewProject,
    handleSelectProject,
    toggleProjectPriority,
  }
}