"use client"

import { useState, useEffect, useCallback } from "react"
import { projectsService } from "~/services/supabase/projects"
import { useAuth } from "~/core/contexts/auth-context"
import type { Task, Project, ActiveTabValue } from "../lib/types"

export function useKanbanApi() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasksByProject, setTasksByProject] = useState<{ [projectId: string]: Task[] }>({})
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTabValue>("projectList")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, isAuthenticated } = useAuth()

  // Carregar projetos do Supabase
  const loadProjects = useCallback(async (): Promise<Project[]> => {
    if (!isAuthenticated) {
      return []
    }

    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Carregando projetos do Supabase...")
      const supabaseProjects = await projectsService.getProjects()
      console.log("✅ Projetos carregados:", supabaseProjects)
      setProjects(supabaseProjects)
      return supabaseProjects
    } catch (err) {
      console.error("❌ Erro ao carregar projetos:", err)
      setError("Erro ao carregar projetos")
      return []
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Carregar tarefas de um projeto específico
  const loadProjectTasks = useCallback(async (projectId: string): Promise<Task[]> => {
    if (!isAuthenticated || !projectId) {
      return []
    }

    try {
      console.log("🔄 Carregando tarefas do projeto:", projectId)
      const tasks = await projectsService.getProjectTasks(projectId)
      console.log("✅ Tarefas carregadas:", tasks)

      setTasksByProject(prev => ({
        ...prev,
        [projectId]: tasks
      }))

      return tasks
    } catch (err) {
      console.error("❌ Erro ao carregar tarefas do projeto:", err)
      setError("Erro ao carregar tarefas do projeto")
      return []
    }
  }, [isAuthenticated])

  // Criar novo projeto
  const createProject = useCallback(async (projectData: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      setLoading(true)
      console.log("🔄 Criando projeto:", projectData)
      const newProject = await projectsService.createProject(projectData)
      console.log("✅ Projeto criado:", newProject)
      
      setProjects(prev => [...prev, newProject])
      return newProject
    } catch (err) {
      console.error("❌ Erro ao criar projeto:", err)
      setError("Erro ao criar projeto")
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Atualizar projeto
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      console.log("🔄 Atualizando projeto:", projectId, updates)
      const updatedProject = await projectsService.updateProject(projectId, updates)
      console.log("✅ Projeto atualizado:", updatedProject)
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      )
      
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      
      return updatedProject
    } catch (err) {
      console.error("❌ Erro ao atualizar projeto:", err)
      setError("Erro ao atualizar projeto")
      throw err
    }
  }, [isAuthenticated, currentProject])

  // Deletar projeto
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      console.log("🔄 Deletando projeto:", projectId)
      await projectsService.deleteProject(projectId)
      console.log("✅ Projeto deletado")
      
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
      console.error("❌ Erro ao deletar projeto:", err)
      setError("Erro ao deletar projeto")
      throw err
    }
  }, [isAuthenticated, currentProject])

  // Criar tarefa em um projeto
  const createTask = useCallback(async (projectId: string, taskData: Partial<Task>, columnId: string = 'backlog'): Promise<Task | null> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      console.log("🔄 Criando tarefa:", projectId, taskData, columnId)
      const newTask = await projectsService.createTask(projectId, taskData, columnId)
      console.log("✅ Tarefa criada:", newTask)
      
      setTasksByProject(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newTask]
      }))
      
      return newTask
    } catch (err) {
      console.error("❌ Erro ao criar tarefa:", err)
      setError("Erro ao criar tarefa")
      throw err
    }
  }, [isAuthenticated])

  // Mover tarefa entre colunas
  const moveTask = useCallback(async (projectId: string, taskId: string, columnId: string, order: number): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error("Usuário não autenticado")
    }

    try {
      console.log("🔄 Movendo tarefa:", taskId, "para", columnId)
      const updatedTask = await projectsService.moveTask(projectId, taskId, columnId, order)
      console.log("✅ Tarefa movida:", updatedTask)
      
      // Atualizar estado local
      setTasksByProject(prev => {
        const projectTasks = prev[projectId] || []
        const updatedTasks = projectTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
        
        return {
          ...prev,
          [projectId]: updatedTasks
        }
      })
    } catch (err) {
      console.error("❌ Erro ao mover tarefa:", err)
      setError("Erro ao mover tarefa")
      throw err
    }
  }, [isAuthenticated])

  // Inicializar dados ao montar
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

  // Carregar tarefas quando o projeto atual mudar
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