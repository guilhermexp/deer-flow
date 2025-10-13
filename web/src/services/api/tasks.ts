/**
 * Serviço de tarefas usando REST API
 */

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

export const tasksApiService = {
  /**
   * Criar nova tarefa no projeto
   */
  async create(
    projectId: number,
    data: TaskCreate,
    columnId: string = 'backlog'
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
