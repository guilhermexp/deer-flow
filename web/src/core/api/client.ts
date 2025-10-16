// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import axios, { type AxiosError } from 'axios';

import { env } from '~/env.js';

const API_URL = env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Clerk auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Clerk session token
    if (typeof window !== 'undefined') {
      try {
        // Import dynamically to avoid SSR issues
        const { useAuth } = await import('@clerk/nextjs');
        
        // Note: This won't work in axios interceptors since hooks can only be used in React components
        // For now, we'll skip token addition in interceptors and handle it in component-level calls
        console.log('🔐 API Request: Clerk auth available but tokens should be added at component level');
      } catch (error) {
        console.error('Failed to get Clerk session:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(new Error(error instanceof Error ? error.message : String(error)))
);

// Response interceptor - only for error handling, no JWT refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Just log errors, don't redirect or try to refresh tokens
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Unknown error'));
  }
);

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
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
