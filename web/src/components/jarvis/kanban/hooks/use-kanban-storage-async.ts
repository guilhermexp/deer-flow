"use client"

import { useCallback } from "react"
import { useAsyncMultiStorage } from "~/hooks/use-async-storage"
import type { Task, Project, ActiveTabValue } from "../lib/types"

export const PROJECTS_STORAGE_KEY = "kanban-projects-v2"
export const TASKS_BY_PROJECT_STORAGE_KEY = "kanban-tasksByProject-v2"
export const LAST_ACTIVE_PROJECT_KEY = "kanban-lastActiveProject-v2"
export const LAST_ACTIVE_TAB_KEY = "kanban-lastActiveTab-v2"

export const initialDefaultProject: Project = {
  id: "default-project-1",
  name: "Meu Primeiro Projeto",
  description: "Um projeto de exemplo para começar a organizar suas tarefas.",
  createdAt: new Date().toISOString(),
  isPriority: false,
}

export const initialTasksData: Task[] = [
  {
    id: "task-1",
    projectId: "default-project-1",
    title: "Apresentar produto e coletar feedback",
    date: "22 Mai 12:01",
    progress: 0,
    comments: 0,
    attachments: 1,
    assignees: [{ name: "João Silva", initials: "JS" }],
    status: "not-started",
    weekDay: "quarta",
    description: "Preparar apresentação do produto.",
  },
  {
    id: "task-2",
    projectId: "default-project-1",
    title: "Agendar treinamento de vendas",
    date: "17 Mai 20:00",
    progress: 61,
    comments: 3,
    attachments: 1,
    assignees: [{ name: "Maria Oliveira", initials: "MO" }],
    status: "paused",
    weekDay: "segunda",
    description: "Organizar treinamento para a equipe.",
  },
  {
    id: "task-3",
    projectId: "default-project-1",
    title: "Revisar orçamento de marketing",
    date: "24 Mai 18:40",
    progress: 75,
    comments: 5,
    attachments: 0,
    assignees: [{ name: "Carlos Pereira", initials: "CP" }],
    status: "in-progress",
    weekDay: "sexta",
    description: "Analisar o orçamento trimestral.",
  },
  {
    id: "task-4",
    projectId: "default-project-1",
    title: "Apresentação finalizada",
    date: "18 Mai 09:00",
    progress: 100,
    comments: 5,
    attachments: 0,
    assignees: [{ name: "Ana Costa", initials: "AC" }],
    status: "done",
    weekDay: "terca",
    description: "Slides da apresentação concluídos.",
  },
]

interface KanbanStorageData extends Record<string, unknown> {
  projects: Project[];
  tasksByProject: { [projectId: string]: Task[] };
  lastActiveProjectId: string | null;
  lastActiveTab: ActiveTabValue;
}

const defaultValues: KanbanStorageData = {
  projects: [initialDefaultProject],
  tasksByProject: { [initialDefaultProject.id]: initialTasksData },
  lastActiveProjectId: null,
  lastActiveTab: "projectList",
};

export function useKanbanStorageAsync() {
  const { data, loading, setData } = useAsyncMultiStorage<KanbanStorageData>(
    {
      projects: PROJECTS_STORAGE_KEY,
      tasksByProject: TASKS_BY_PROJECT_STORAGE_KEY,
      lastActiveProjectId: LAST_ACTIVE_PROJECT_KEY,
      lastActiveTab: LAST_ACTIVE_TAB_KEY,
    },
    defaultValues
  );

  // Get current project from ID
  const getCurrentProject = useCallback((): Project | null => {
    if (!data.lastActiveProjectId || data.projects.length === 0) {
      return data.projects[0] || null;
    }
    return data.projects.find(p => p.id === data.lastActiveProjectId) || data.projects[0] || null;
  }, [data.projects, data.lastActiveProjectId]);

  // Save methods
  const saveProjects = useCallback((projects: Project[]) => {
    setData('projects', projects);
  }, [setData]);

  const saveTasks = useCallback((tasksByProject: { [projectId: string]: Task[] }) => {
    setData('tasksByProject', tasksByProject);
  }, [setData]);

  const saveLastActiveProject = useCallback((project: Project | null) => {
    setData('lastActiveProjectId', project?.id || null);
  }, [setData]);

  const saveLastActiveTab = useCallback((tab: ActiveTabValue) => {
    setData('lastActiveTab', tab);
  }, [setData]);

  return {
    // Data
    projects: data.projects,
    tasksByProject: data.tasksByProject,
    currentProject: getCurrentProject(),
    lastActiveTab: data.lastActiveTab,
    loading,
    
    // Save methods
    saveProjects,
    saveTasks,
    saveLastActiveProject,
    saveLastActiveTab,
  };
}