// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient, type Task, type Reminder, type DashboardStats } from './client';

export interface TaskCreate {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string;
}

export interface TaskUpdate extends Partial<TaskCreate> {
  completed_at?: string;
}

export interface ReminderCreate {
  title: string;
  time: string;
  date?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface ReminderUpdate extends Partial<ReminderCreate> {
  is_completed?: boolean;
}

export const dashboardApi = {
  // Tasks
  async getTasks(params?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/dashboard/tasks', { params });
    return response.data;
  },

  async createTask(data: TaskCreate): Promise<Task> {
    const response = await apiClient.post<Task>('/dashboard/tasks', data);
    return response.data;
  },

  async updateTask(id: number, data: TaskUpdate): Promise<Task> {
    const response = await apiClient.put<Task>(`/dashboard/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: number): Promise<void> {
    await apiClient.delete(`/dashboard/tasks/${id}`);
  },

  // Reminders
  async getReminders(params?: {
    date?: string;
    priority?: string;
    category?: string;
    is_completed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Reminder[]> {
    const response = await apiClient.get<Reminder[]>('/dashboard/reminders', { params });
    return response.data;
  },

  async createReminder(data: ReminderCreate): Promise<Reminder> {
    const response = await apiClient.post<Reminder>('/dashboard/reminders', data);
    return response.data;
  },

  async updateReminder(id: number, data: ReminderUpdate): Promise<Reminder> {
    const response = await apiClient.put<Reminder>(`/dashboard/reminders/${id}`, data);
    return response.data;
  },

  async deleteReminder(id: number): Promise<void> {
    await apiClient.delete(`/dashboard/reminders/${id}`);
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};