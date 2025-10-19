// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";
import { useTasksApi as useTasksApiHook } from "~/hooks/use-tasks-api";

// Re-export the Task interface for compatibility
export type { Task } from "~/hooks/use-tasks-api";

// Alias para compatibilidade - usa API hook
export function useTasksApi(projectId?: number) {
  return useTasksApiHook(projectId);
}
