"use client";

import type { Project } from "../lib/types";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { PlusCircle, Eye, Star, StarOff } from "lucide-react";
import { motion } from "framer-motion";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";

interface ProjectListViewProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onTriggerCreateProject: () => void;
  onToggleProjectPriority: (projectId: string) => void;
}

export default function ProjectListView({
  projects,
  onSelectProject,
  onTriggerCreateProject,
  onToggleProjectPriority,
}: ProjectListViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col"
    >
      <div className="p-6 pt-0">
        <Button
          onClick={onTriggerCreateProject}
          className="w-full border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-grow flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-2xl bg-white/[0.05]">
              <PlusCircle className="h-16 w-16 text-gray-400 opacity-50" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Nenhum projeto encontrado
            </h2>
            <p className="mb-6 text-gray-400">
              Comece criando seu primeiro projeto para organizar suas tarefas.
            </p>
          </motion.div>
        </div>
      ) : (
        <ScrollArea className="flex-grow p-6 pt-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Card className="flex h-full flex-col border-0 bg-transparent shadow-none">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <CardTitle className="truncate text-lg text-white">
                              {project.name}
                            </CardTitle>
                            {project.isPriority && (
                              <Badge className="border border-red-500/30 bg-red-500/20 text-xs text-red-400">
                                <Star className="mr-1 h-3 w-3" />
                                Prioridade
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs text-gray-400">
                            Criado em:{" "}
                            {new Date(project.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleProjectPriority(project.id);
                          }}
                          className="h-8 w-8 shrink-0 p-0"
                        >
                          {project.isPriority ? (
                            <Star className="h-4 w-4 fill-current text-red-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="mb-4 line-clamp-3 text-sm text-gray-400">
                        {project.description || "Nenhuma descrição fornecida."}
                      </p>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button
                        onClick={() => onSelectProject(project.id)}
                        className="w-full border-white/10 bg-white/[0.05] text-gray-300 hover:bg-white/[0.08] hover:text-gray-100"
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
  );
}
