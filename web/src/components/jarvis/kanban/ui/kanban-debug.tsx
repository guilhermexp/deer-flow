"use client"

import { useEffect } from "react"
import { useKanbanBoard } from "../hooks/use-kanban-board"

export function KanbanDebug() {
  const {
    projects,
    currentProject,
    tasksByProject,
    activeTab,
    currentProjectTasks,
  } = useKanbanBoard()

  useEffect(() => {
    console.log("=== KANBAN DEBUG (React) ===")
    console.log("Projects:", projects)
    console.log("Current project:", currentProject)
    console.log("Tasks by project:", tasksByProject)
    console.log("Active tab:", activeTab)
    console.log("Current project tasks:", currentProjectTasks)
    
    if (currentProject) {
      const projectTasks = tasksByProject[currentProject.id] || []
      console.log(`Tasks for project ${currentProject.name}:`, projectTasks)
    }
  }, [projects, currentProject, tasksByProject, activeTab, currentProjectTasks])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Kanban Debug</h3>
      <div>Projects: {projects.length}</div>
      <div>Current: {currentProject?.name || "None"}</div>
      <div>Tab: {activeTab}</div>
      <div>Tasks: {currentProjectTasks.length}</div>
      {currentProject && (
        <div>Project tasks: {(tasksByProject[currentProject.id] || []).length}</div>
      )}
    </div>
  )
}