// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import axios, { AxiosError } from 'axios';
import { env } from '~/env.js';

const API_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:9090/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
};

export const getTokens = () => {
  if (typeof window !== 'undefined' && !accessToken) {
    accessToken = localStorage.getItem('access_token');
    refreshToken = localStorage.getItem('refresh_token');
  }
  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Request interceptor to add auth token
// DISABLED - Using Supabase authentication instead
/*
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
*/

// Response interceptor - only for error handling, no JWT refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Just log errors, don't redirect or try to refresh tokens
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  title: string;
  time: string;
  date?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  today_reminders: number;
  upcoming_reminders: number;
}