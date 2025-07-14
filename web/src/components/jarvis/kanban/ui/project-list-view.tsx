"use client"

import type { Project } from "../lib/types"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Badge } from "~/components/ui/badge"
import { PlusCircle, Eye, Star, StarOff } from "lucide-react"
import { motion } from "framer-motion"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"

interface ProjectListViewProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onTriggerCreateProject: () => void
  onToggleProjectPriority: (projectId: string) => void
}

export default function ProjectListView({ projects, onSelectProject, onTriggerCreateProject, onToggleProjectPriority }: ProjectListViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 pt-0">
        <Button
          onClick={onTriggerCreateProject}
          className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-white/[0.05] rounded-2xl flex items-center justify-center">
              <PlusCircle className="w-16 h-16 text-gray-400 opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Nenhum projeto encontrado</h2>
            <p className="text-gray-400 mb-6">
              Comece criando seu primeiro projeto para organizar suas tarefas.
            </p>
          </motion.div>
        </div>
      ) : (
        <ScrollArea className="flex-grow p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <LiquidGlassCard className="h-full rounded-xl">
                  <Card className="bg-transparent border-0 shadow-none h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg text-white truncate">{project.name}</CardTitle>
                          {project.isPriority && (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Prioridade
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs text-gray-400">
                          Criado em: {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleProjectPriority(project.id)
                        }}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        {project.isPriority ? (
                          <Star className="h-4 w-4 text-red-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                      {project.description || "Nenhuma descrição fornecida."}
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => onSelectProject(project.id)}
                      className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 hover:text-gray-100 border-white/10"
                      variant="outline"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Quadro
                    </Button>
                  </div>
                  </Card>
                </LiquidGlassCard>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )
}
