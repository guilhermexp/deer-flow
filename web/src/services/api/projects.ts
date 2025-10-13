/**
 * Serviço de projetos usando REST API
 */

import { api } from './http-client';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
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

export const projectsApiService = {
  /**
   * Listar todos os projetos do usuário
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/projects?${query}` : '/projects';

      return await api.get<Project[]>(endpoint);
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      return [];
    }
  },

  /**
   * Buscar projeto por ID
   */
  async get(id: number): Promise<Project | null> {
    try {
      const project = await api.get<Project>(`/projects/${id}`);
      return project;
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      return null;
    }
  },

  /**
   * Criar novo projeto
   */
  async create(data: ProjectCreate): Promise<Project> {
    return await api.post<Project>('/projects', data);
  },

  /**
   * Atualizar projeto
   */
  async update(id: number, data: ProjectUpdate): Promise<Project> {
    return await api.put<Project>(`/projects/${id}`, data);
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
      console.error('Erro ao buscar kanban do projeto:', error);
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
  async getProjects(params?: { status?: string; limit?: number; offset?: number }): Promise<Project[]> {
    return this.list(params);
  },

  /**
   * Alias para create() - compatibilidade
   */
  async createProject(data: ProjectCreate): Promise<Project> {
    return this.create(data);
  },

  /**
   * Alias para update() - compatibilidade
   */
  async updateProject(id: number, data: ProjectUpdate): Promise<Project> {
    return this.update(id, data);
  },

  /**
   * Alias para delete() - compatibilidade
   */
  async deleteProject(id: number): Promise<void> {
    return this.delete(id);
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
    board.columns.forEach(column => {
      tasks.push(...column.tasks);
    });
    return tasks;
  },

  /**
   * Criar tarefa em um projeto - compatibilidade
   */
  async createTask(projectId: number, taskData: any, columnId = 'backlog'): Promise<any> {
    // Importar e usar tasksApiService
    const { tasksApiService } = await import('./tasks');
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
  async moveTask(projectId: number, taskId: number, columnId: string, order: number): Promise<void> {
    const { tasksApiService } = await import('./tasks');
    await tasksApiService.move(projectId, taskId, { column_id: columnId, order });
  },

  /**
   * Deletar tarefa - compatibilidade
   */
  async deleteTask(taskId: number): Promise<void> {
    // Esta funcionalidade precisa ser implementada no backend
    // Por enquanto, não faz nada
    console.warn('deleteTask não implementado ainda na API');
  }
};
