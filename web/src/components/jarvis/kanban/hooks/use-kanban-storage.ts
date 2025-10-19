"use client";

import { useCallback } from "react";
import type { Task, Project, ActiveTabValue } from "../lib/types";

export const PROJECTS_STORAGE_KEY = "kanban-projects-v2";
export const TASKS_BY_PROJECT_STORAGE_KEY = "kanban-tasksByProject-v2";
export const LAST_ACTIVE_PROJECT_KEY = "kanban-lastActiveProject-v2";
export const LAST_ACTIVE_TAB_KEY = "kanban-lastActiveTab-v2";

export const initialDefaultProject: Project = {
  id: "default-project-1",
  name: "Meu Primeiro Projeto",
  description: "Um projeto de exemplo para começar a organizar suas tarefas.",
  createdAt: new Date().toISOString(),
  isPriority: false,
};

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
];

export function useKanbanStorage() {
  // Load projects from localStorage
  const loadProjects = useCallback((): Project[] => {
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    let loadedProjects: Project[] = [];

    if (storedProjects) {
      try {
        loadedProjects = JSON.parse(storedProjects);
      } catch (e) {
        console.error("Error loading projects from localStorage:", e);
      }
    }

    if (loadedProjects.length === 0) {
      loadedProjects = [initialDefaultProject];
      localStorage.setItem(
        PROJECTS_STORAGE_KEY,
        JSON.stringify(loadedProjects)
      );
    }

    return loadedProjects;
  }, []);

  // Load tasks from localStorage
  const loadTasks = useCallback(
    (projects: Project[]): { [projectId: string]: Task[] } => {
      const storedTasks = localStorage.getItem(TASKS_BY_PROJECT_STORAGE_KEY);
      let loadedTasks: { [projectId: string]: Task[] } = {};

      if (storedTasks) {
        try {
          loadedTasks = JSON.parse(storedTasks);
        } catch (e) {
          console.error("Error loading tasks from localStorage:", e);
        }
      }

      // Initialize default tasks if needed
      if (
        !loadedTasks[initialDefaultProject.id] &&
        projects.find((p) => p.id === initialDefaultProject.id)
      ) {
        loadedTasks[initialDefaultProject.id] = initialTasksData.map(
          (task) => ({
            ...task,
            projectId: initialDefaultProject.id,
          })
        );
      }

      return loadedTasks;
    },
    []
  );

  // Load last active project
  const loadLastActiveProject = useCallback(
    (projects: Project[]): Project | null => {
      const lastActiveProjectId = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY);
      return projects.find((p) => p.id === lastActiveProjectId) || null;
    },
    []
  );

  // Load last active tab
  const loadLastActiveTab = useCallback((): ActiveTabValue | null => {
    return localStorage.getItem(LAST_ACTIVE_TAB_KEY) as ActiveTabValue | null;
  }, []);

  // Save projects to localStorage
  const saveProjects = useCallback((projects: Project[]) => {
    if (projects.length > 0 || localStorage.getItem(PROJECTS_STORAGE_KEY)) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = useCallback(
    (tasksByProject: { [projectId: string]: Task[] }) => {
      if (
        Object.keys(tasksByProject).length > 0 ||
        localStorage.getItem(TASKS_BY_PROJECT_STORAGE_KEY)
      ) {
        localStorage.setItem(
          TASKS_BY_PROJECT_STORAGE_KEY,
          JSON.stringify(tasksByProject)
        );
      }
    },
    []
  );

  // Save last active project
  const saveLastActiveProject = useCallback((project: Project | null) => {
    if (project) {
      localStorage.setItem(LAST_ACTIVE_PROJECT_KEY, project.id);
    } else {
      localStorage.removeItem(LAST_ACTIVE_PROJECT_KEY);
    }
  }, []);

  // Save last active tab
  const saveLastActiveTab = useCallback((tab: ActiveTabValue) => {
    localStorage.setItem(LAST_ACTIVE_TAB_KEY, tab);
  }, []);

  return {
    loadProjects,
    loadTasks,
    loadLastActiveProject,
    loadLastActiveTab,
    saveProjects,
    saveTasks,
    saveLastActiveProject,
    saveLastActiveTab,
  };
}
