// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from "./client";

export interface SleepPhases {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export interface Medication {
  name: string;
  dosage: string;
  taken: boolean;
  time?: string;
}

export interface HealthData {
  id: number;
  date: string;
  health_score?: number;
  hydration_ml: number;
  hydration_goal_ml: number;
  sleep_hours?: number;
  sleep_quality?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  pulse?: number;
  workouts_completed: number;
  workouts_goal: number;
  sleep_phases?: SleepPhases;
  medications?: Medication[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthDataCreate {
  date?: string;
  health_score?: number;
  hydration_ml?: number;
  hydration_goal_ml?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  pulse?: number;
  workouts_completed?: number;
  workouts_goal?: number;
  sleep_phases?: SleepPhases;
  medications?: Medication[];
  notes?: string;
}

export interface HealthDataUpdate extends Omit<HealthDataCreate, "date"> {}

export interface HealthStats {
  avg_health_score?: number;
  avg_sleep_hours?: number;
  avg_sleep_quality?: number;
  total_workouts: number;
  avg_hydration_ml: number;
  hydration_goal_achievement: number;
  workout_goal_achievement: number;
  days_tracked: number;
}

// Individual functions for easier import
export async function getHealthData(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<HealthData[]> {
  const response = await apiClient.get<HealthData[]>("/health/data", {
    params,
  });
  return response.data;
}

export async function getTodayHealthData(): Promise<HealthData | null> {
  const response = await apiClient.get<HealthData | null>("/health/data/today");
  return response.data;
}

export async function getHealthDataByDate(
  date: string
): Promise<HealthData | null> {
  const response = await apiClient.get<HealthData | null>(
    `/health/data/${date}`
  );
  return response.data;
}

export async function createHealthData(
  data: HealthDataCreate
): Promise<HealthData> {
  const response = await apiClient.post<HealthData>("/health/data", data);
  return response.data;
}

export async function updateHealthData(
  date: string,
  data: HealthDataUpdate
): Promise<HealthData> {
  const response = await apiClient.put<HealthData>(
    `/health/data/${date}`,
    data
  );
  return response.data;
}

export async function deleteHealthData(id: number): Promise<void> {
  await apiClient.delete(`/health/data/${id}`);
}

export async function getHealthStats(days = 30): Promise<HealthStats> {
  const response = await apiClient.get<HealthStats>("/health/stats", {
    params: { days },
  });
  return response.data;
}

// Backward compatibility
export const healthApi = {
  getHealthData,
  getTodayHealthData,
  getHealthDataByDate,
  createOrUpdateHealthData: createHealthData,
  updateHealthData: (id: number, data: HealthDataUpdate) =>
    updateHealthData(id.toString(), data),
  deleteHealthData,
  getHealthStats,
};
