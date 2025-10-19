/**
 * Serviço de projetos usando REST API
 */

import { api } from "./http-client";
import type { AuthenticatedApiClient } from "~/hooks/use-authenticated-api";

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
  completed_task_count?: number;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  status?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
}

export interface KanbanTask {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  order: number;
  created_at: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
}

export interface KanbanBoard {
  project_id: number;
  project_name: string;
  columns: KanbanColumn[];
}

// Adapter type for frontend compatibility
export interface FrontendProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isPriority?: boolean;
}

// Adapter function: API Project → Frontend Project
function adaptProjectToFrontend(apiProject: Project): FrontendProject {
  return {
    id: String(apiProject.id), // Convert number to string
    name: apiProject.name,
    description: apiProject.description || undefined,
    createdAt: apiProject.created_at,
    isPriority: false,
  };
}

// Adapter function: Frontend Project → API Project Create
function adaptFrontendProjectToAPI(
  frontendProject: Partial<FrontendProject>
): ProjectCreate {
  return {
    name: frontendProject.name || "",
    description: frontendProject.description || null,
    color: "#3B82F6", // Default color
    icon: "folder", // Default icon
    status: "active", // Default status
  };
}

export const projectsApiService = {
  /**
   * Listar todos os projetos do usuário
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FrontendProject[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset)
        queryParams.append("offset", params.offset.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/projects?${query}` : "/projects";

      const apiProjects = await api.get<Project[]>(endpoint);
      return apiProjects.map(adaptProjectToFrontend);
    } catch (error) {
      console.error("Erro ao listar projetos:", error);
      return [];
    }
  },

  /**
   * Buscar projeto por ID
   */
  async get(id: number): Promise<FrontendProject | null> {
    try {
      const project = await api.get<Project>(`/projects/${id}`);
      return adaptProjectToFrontend(project);
    } catch (error) {
      console.error("Erro ao buscar projeto:", error);
      return null;
    }
  },

  /**
   * Criar novo projeto
   */
  async create(
    data: ProjectCreate | Partial<FrontendProject>
  ): Promise<FrontendProject> {
    // If data looks like FrontendProject, adapt it
    const apiData =
      "createdAt" in data || "isPriority" in data
        ? adaptFrontendProjectToAPI(data)
        : (data as ProjectCreate);

    const created = await api.post<Project>("/projects", apiData);
    return adaptProjectToFrontend(created);
  },

  /**
   * Atualizar projeto
   */
  async update(id: number, data: ProjectUpdate): Promise<FrontendProject> {
    const updated = await api.put<Project>(`/projects/${id}`, data);
    return adaptProjectToFrontend(updated);
  },

  /**
   * Deletar projeto
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  /**
   * Buscar quadro Kanban do projeto
   */
  async getKanban(projectId: number): Promise<KanbanBoard | null> {
    try {
      const board = await api.get<KanbanBoard>(`/projects/${projectId}/kanban`);
      return board;
    } catch (error) {
      console.error("Erro ao buscar kanban do projeto:", error);
      return null;
    }
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkProjectsTableExists(): Promise<boolean> {
    return true;
  },

  // ===== Métodos wrapper para compatibilidade com hooks antigos =====

  /**
   * Alias para list() - compatibilidade
   */
  async getProjects(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FrontendProject[]> {
    return this.list(params);
  },

  /**
   * Alias para create() - compatibilidade
   */
  async createProject(
    data: ProjectCreate | Partial<FrontendProject>
  ): Promise<FrontendProject> {
    return this.create(data);
  },

  /**
   * Alias para update() - compatibilidade
   */
  async updateProject(
    id: number | string,
    data: ProjectUpdate
  ): Promise<FrontendProject> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return this.update(numericId, data);
  },

  /**
   * Alias para delete() - compatibilidade
   */
  async deleteProject(id: number | string): Promise<void> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return this.delete(numericId);
  },

  /**
   * Alias para getKanban() - compatibilidade
   */
  async getKanbanBoard(projectId: number): Promise<KanbanBoard | null> {
    return this.getKanban(projectId);
  },

  /**
   * Buscar tarefas de um projeto - compatibilidade
   */
  async getProjectTasks(projectId: number): Promise<any[]> {
    const board = await this.getKanban(projectId);
    if (!board) return [];

    // Coletar todas as tarefas de todas as colunas
    const tasks: any[] = [];
    board.columns.forEach((column) => {
      tasks.push(...column.tasks);
    });
    return tasks;
  },

  /**
   * Criar tarefa em um projeto - compatibilidade
   */
  async createTask(
    projectId: number,
    taskData: any,
    columnId = "backlog"
  ): Promise<any> {
    // Importar e usar tasksApiService
    const { tasksApiService } = await import("./tasks");
    return tasksApiService.create(projectId, taskData, columnId);
  },

  /**
   * Atualizar tarefa - compatibilidade
   */
  async updateTask(taskId: number, updates: any): Promise<any> {
    // Esta funcionalidade precisa ser implementada no backend
    // Por enquanto, retorna um objeto simulado
    return { id: taskId, ...updates };
  },

  /**
   * Mover tarefa - compatibilidade
   */
  async moveTask(
    projectId: number,
    taskId: number,
    columnId: string,
    order: number
  ): Promise<void> {
    const { tasksApiService } = await import("./tasks");
    await tasksApiService.move(projectId, taskId, {
      column_id: columnId,
      order,
    });
  },

  /**
   * Deletar tarefa - compatibilidade
   */
  async deleteTask(taskId: number): Promise<void> {
    // Esta funcionalidade precisa ser implementada no backend
    // Por enquanto, não faz nada
    console.warn("deleteTask não implementado ainda na API");
  },
};

/**
 * Create projects API service with authentication
 * Use this factory function with the useAuthenticatedApi hook
 */
export function createProjectsApiService(apiClient: AuthenticatedApiClient) {
  return {
    /**
     * Listar todos os projetos do usuário (autenticado)
     */
    async list(params?: {
      status?: string;
      limit?: number;
      offset?: number;
    }): Promise<FrontendProject[]> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append("status", params.status);
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.offset)
          queryParams.append("offset", params.offset.toString());

        const query = queryParams.toString();
        const endpoint = query ? `/projects?${query}` : "/projects";

        const apiProjects = await apiClient.get<Project[]>(endpoint);
        return apiProjects.map(adaptProjectToFrontend);
      } catch (error) {
        console.error("Erro ao listar projetos:", error);
        return [];
      }
    },

    /** Buscar projeto por ID */
    async get(id: number): Promise<FrontendProject | null> {
      try {
        const project = await apiClient.get<Project>(`/projects/${id}`);
        return adaptProjectToFrontend(project);
      } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        return null;
      }
    },

    /** Criar novo projeto */
    async create(
      data: ProjectCreate | Partial<FrontendProject>
    ): Promise<FrontendProject> {
      const apiData =
        "createdAt" in data || "isPriority" in data
          ? adaptFrontendProjectToAPI(data)
          : (data as ProjectCreate);

      const created = await apiClient.post<Project>("/projects", apiData);
      return adaptProjectToFrontend(created);
    },

    /** Atualizar projeto */
    async update(id: number, data: ProjectUpdate): Promise<FrontendProject> {
      const updated = await apiClient.put<Project>(`/projects/${id}`, data);
      return adaptProjectToFrontend(updated);
    },

    /** Deletar projeto */
    async delete(id: number): Promise<void> {
      await apiClient.delete(`/projects/${id}`);
    },

    /** Buscar quadro Kanban do projeto */
    async getKanban(projectId: number): Promise<KanbanBoard | null> {
      try {
        const board = await apiClient.get<KanbanBoard>(
          `/projects/${projectId}/kanban`
        );
        return board;
      } catch (error) {
        console.error("Erro ao buscar kanban do projeto:", error);
        return null;
      }
    },

    /** Verificar se tabela existe (compatibilidade com código antigo) */
    async checkProjectsTableExists(): Promise<boolean> {
      return true;
    },

    // ===== Métodos wrapper para compatibilidade com hooks antigos =====

    async getProjects(params?: {
      status?: string;
      limit?: number;
      offset?: number;
    }): Promise<FrontendProject[]> {
      return this.list(params);
    },

    async createProject(
      data: ProjectCreate | Partial<FrontendProject>
    ): Promise<FrontendProject> {
      return this.create(data);
    },

    async updateProject(
      id: number | string,
      data: ProjectUpdate
    ): Promise<FrontendProject> {
      const numericId = typeof id === "string" ? parseInt(id, 10) : id;
      return this.update(numericId, data);
    },

    async deleteProject(id: number | string): Promise<void> {
      const numericId = typeof id === "string" ? parseInt(id, 10) : id;
      return this.delete(numericId);
    },

    async getKanbanBoard(projectId: number): Promise<KanbanBoard | null> {
      return this.getKanban(projectId);
    },

    async getProjectTasks(projectId: number): Promise<any[]> {
      const board = await this.getKanban(projectId);
      if (!board) return [];
      const tasks: any[] = [];
      board.columns.forEach((column) => {
        tasks.push(...column.tasks);
      });
      return tasks;
    },

    async createTask(
      projectId: number,
      taskData: any,
      columnId = "backlog"
    ): Promise<any> {
      const { createTasksApiService } = await import("./tasks");
      const tasks = createTasksApiService(apiClient);
      return tasks.create(projectId, taskData, columnId);
    },

    async updateTask(taskId: number, updates: any): Promise<any> {
      return { id: taskId, ...updates };
    },

    async moveTask(
      projectId: number,
      taskId: number,
      columnId: string,
      order: number
    ): Promise<void> {
      const { createTasksApiService } = await import("./tasks");
      const tasks = createTasksApiService(apiClient);
      await tasks.move(projectId, taskId, { column_id: columnId, order });
    },

    async deleteTask(taskId: number): Promise<void> {
      console.warn("deleteTask não implementado ainda na API");
    },
  };
}
