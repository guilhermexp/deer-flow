// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from "./client";

export interface Project {
  id: number;
  name: string;
  description?: string;
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
  description?: string;
  color?: string;
  icon?: string;
  status?: string;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  order: number;
  created_at: string;
}

export interface KanbanTaskCreate {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  order?: number;
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

export interface TaskMoveRequest {
  column_id: string;
  order: number;
}

export const projectsApi = {
  async getProjects(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    const response = await apiClient.get<Project[]>("/projects/", { params });
    return response.data;
  },

  async getProject(id: number): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: ProjectCreate): Promise<Project> {
    const response = await apiClient.post<Project>("/projects/", data);
    return response.data;
  },

  async updateProject(id: number, data: ProjectUpdate): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  async getKanbanBoard(projectId: number): Promise<KanbanBoard> {
    const response = await apiClient.get<KanbanBoard>(
      `/projects/${projectId}/kanban`
    );
    return response.data;
  },

  async createKanbanTask(
    projectId: number,
    task: KanbanTaskCreate,
    columnId = "backlog"
  ): Promise<KanbanTask> {
    const response = await apiClient.post<KanbanTask>(
      `/projects/${projectId}/tasks?column_id=${columnId}`,
      task
    );
    return response.data;
  },

  async moveKanbanTask(
    projectId: number,
    taskId: number,
    data: TaskMoveRequest
  ): Promise<KanbanTask> {
    const response = await apiClient.put<KanbanTask>(
      `/projects/${projectId}/tasks/${taskId}/move`,
      data
    );
    return response.data;
  },
};
