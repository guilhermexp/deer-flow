/**
 * Serviço de tarefas usando REST API
 */

import type { AuthenticatedApiClient } from '~/hooks/use-authenticated-api';

import { api } from './http-client';
import type { TaskStatus, TaskPriority, KanbanTask } from './projects';

export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string | null;
  due_date?: string | null;
}

export interface TaskMoveRequest {
  column_id: string;
  order: number;
}

/**
 * Create tasks API service with authentication
 * Use this factory function with the useAuthenticatedApi hook
 */
export function createTasksApiService(apiClient: AuthenticatedApiClient) {
  return {
    /**
     * Criar nova tarefa no projeto
     */
    async create(
      projectId: number,
      data: TaskCreate,
      columnId = 'backlog'
    ): Promise<KanbanTask> {
      const queryParams = new URLSearchParams();
      queryParams.append('column_id', columnId);

      return await apiClient.post<KanbanTask>(
        `/projects/${projectId}/tasks?${queryParams.toString()}`,
        data
      );
    },

    /**
     * Mover tarefa para outra coluna ou posição
     */
    async move(
      projectId: number,
      taskId: number,
      data: TaskMoveRequest
    ): Promise<KanbanTask> {
      return await apiClient.put<KanbanTask>(
        `/projects/${projectId}/tasks/${taskId}/move`,
        data
      );
    },

    /**
     * Verificar se tabela existe (compatibilidade com código antigo)
     * No REST API, sempre retorna true
     */
    async checkTasksTableExists(): Promise<boolean> {
      return true;
    }
  };
}

// Legacy service without authentication (deprecated)
// Use createTasksApiService with useAuthenticatedApi hook instead
export const tasksApiService = {
  /**
   * Criar nova tarefa no projeto
   */
  async create(
    projectId: number,
    data: TaskCreate,
    columnId = 'backlog'
  ): Promise<KanbanTask> {
    const queryParams = new URLSearchParams();
    queryParams.append('column_id', columnId);

    return await api.post<KanbanTask>(
      `/projects/${projectId}/tasks?${queryParams.toString()}`,
      data
    );
  },

  /**
   * Mover tarefa para outra coluna ou posição
   */
  async move(
    projectId: number,
    taskId: number,
    data: TaskMoveRequest
  ): Promise<KanbanTask> {
    return await api.put<KanbanTask>(
      `/projects/${projectId}/tasks/${taskId}/move`,
      data
    );
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkTasksTableExists(): Promise<boolean> {
    return true;
  }
};
