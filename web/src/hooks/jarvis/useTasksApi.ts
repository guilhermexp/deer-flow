// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client"
import { useTasksSupabase } from "~/hooks/use-tasks-supabase"

// Re-export the Task interface for compatibility
export type { Task } from "~/hooks/use-tasks-supabase"

// Alias para compatibilidade - usa Supabase diretamente
export function useTasksApi() {
  return useTasksSupabase()
}