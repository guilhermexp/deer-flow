"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "~/components/ui/badge"
import { Star, Clock, AlertTriangle, CheckCircle2, Circle, Play, Pause } from "lucide-react"
// Remove mock data import
import LiquidGlassCard from "~/components/ui/liquid-glass-card"

interface PriorityProject {
  id: string
  name: string
  description?: string
  isPriority: boolean
  createdAt: string
}

interface PriorityItem {
  id: string
  title: string
  type: "task" | "project" | "kanban-task"
  priority: "high" | "medium" | "low"
  description?: string
  status?: string
  day?: string
  projectName?: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  progress: number
}

export default function PrioritiesCard() {
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([])

  useEffect(() => {
    const loadPriorityItems = () => {
      const items: PriorityItem[] = []

      // Por enquanto, não carregamos tarefas mockadas
      // TODO: Integrar com useTasksApi para carregar tarefas reais

      // Carregar projetos marcados como prioridade
      const storedProjects = localStorage.getItem("kanban-projects-v2")
      if (storedProjects) {
        try {
          const projects: PriorityProject[] = JSON.parse(storedProjects)
          const priorityProjects = projects.filter(project => project.isPriority)
          priorityProjects.forEach(project => {
            items.push({
              id: project.id,
              title: project.name,
              type: "project",
              priority: "high", // Projetos marcados como prioridade são sempre high
              description: project.description,
            })
          })
                        } catch {
          // console.error("Erro ao carregar projetos:", error)
        }
      }

      // Carregar tarefas do Kanban com progresso alto ou status crítico
      const storedTasks = localStorage.getItem("kanban-tasksByProject-v2")
      if (storedTasks) {
        try {
          const tasksByProject = JSON.parse(storedTasks)
          Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
            const projectTasks = tasks as Task[]
            // Tarefas em progresso com mais de 50% de conclusão ou tarefas pausadas
            const importantTasks = projectTasks.filter(task => 
              (task.status === "in-progress" && task.progress > 50) || 
              task.status === "paused"
            )
            
            importantTasks.forEach(task => {
              items.push({
                id: `${projectId}-${task.id}`,
                title: task.title,
                type: "kanban-task",
                priority: task.status === "paused" ? "high" : "medium",
                description: task.description,
                status: task.status,
                projectName: getProjectName(projectId),
              })
            })
          })
                } catch {
          // console.error("Erro ao carregar projetos:", error)
        }
      }

      // Ordenar por prioridade (high primeiro)
      items.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      setPriorityItems(items.slice(0, 6)) // Limitar a 6 itens para melhor responsividade
    }

    const getProjectName = (projectId: string): string => {
      const storedProjects = localStorage.getItem("kanban-projects-v2")
      if (storedProjects) {
        try {
          const projects: PriorityProject[] = JSON.parse(storedProjects)
          const project = projects.find((p: PriorityProject) => p.id === projectId)
          return project?.name || "Projeto Desconhecido"
        } catch {
          return "Projeto Desconhecido"
        }
      }
      return "Projeto Desconhecido"
    }

    loadPriorityItems()
    
    // Atualizar a cada 30 segundos para capturar mudanças
    const interval = setInterval(loadPriorityItems, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-400" />
      default:
        return <Circle className="h-4 w-4 text-blue-400" />
    }
  }

  const getTypeIcon = (type: string, status?: string) => {
    if (type === "project") {
      return <Star className="h-4 w-4 text-purple-400" />
    }
    if (type === "kanban-task") {
      if (status === "paused") {
        return <Pause className="h-4 w-4 text-orange-400" />
      }
      if (status === "in-progress") {
        return <Play className="h-4 w-4 text-green-400" />
      }
    }
    return <CheckCircle2 className="h-4 w-4 text-blue-400" />
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  const getDayTranslation = (day?: string) => {
    const dayMap: { [key: string]: string } = {
      monday: "Segunda",
      tuesday: "Terça",
      wednesday: "Quarta",
      thursday: "Quinta",
      friday: "Sexta",
      saturday: "Sábado",
      sunday: "Domingo",
    }
    return day ? dayMap[day] || day : ""
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-medium text-white">
            <motion.div
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="group"
            >
              <AlertTriangle className="h-4 w-4 text-gray-400 transition-colors group-hover:text-orange-400" />
            </motion.div>
            Prioridades
          </h3>
        </div>
        <div>
          {priorityItems.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">
                Nenhum item prioritário pendente
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {priorityItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-2 mt-0.5">
                    {getTypeIcon(item.type, item.status)}
                    {getPriorityIcon(item.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm text-white/90 truncate">
                        {item.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityBadgeColor(item.priority)}`}
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-white/70 line-clamp-2 mb-1">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      {item.type === "task" && item.day && (
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                          {getDayTranslation(item.day)}
                        </span>
                      )}
                      {item.type === "project" && (
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">
                          Projeto
                        </span>
                      )}
                      {item.type === "kanban-task" && item.projectName && (
                        <span className="bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-full text-xs">
                          {item.projectName}
                        </span>
                      )}
                      {item.status && (
                        <span className="capitalize">
                          {item.status === "in-progress" ? "Em Andamento" : 
                           item.status === "paused" ? "Pausado" :
                           item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </motion.div>
  )
}