/**
 * Serviço de dados de saúde usando REST API
 */

import { api } from './http-client';

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
  time?: string | null;
}

export interface HealthData {
  id: number;
  date: string;
  health_score: number | null;
  hydration_ml: number;
  hydration_goal_ml: number;
  sleep_hours: number | null;
  sleep_quality: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse: number | null;
  workouts_completed: number;
  workouts_goal: number;
  sleep_phases: Record<string, number> | null;
  medications: Record<string, any>[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthDataCreate {
  date?: string | null;
  health_score?: number | null;
  hydration_ml?: number;
  hydration_goal_ml?: number;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  pulse?: number | null;
  workouts_completed?: number;
  workouts_goal?: number;
  sleep_phases?: SleepPhases | null;
  medications?: Medication[] | null;
  notes?: string | null;
}

export interface HealthDataUpdate {
  health_score?: number | null;
  hydration_ml?: number;
  hydration_goal_ml?: number;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  pulse?: number | null;
  workouts_completed?: number;
  workouts_goal?: number;
  sleep_phases?: SleepPhases | null;
  medications?: Medication[] | null;
  notes?: string | null;
}

export interface HealthStats {
  avg_health_score: number | null;
  avg_sleep_hours: number | null;
  avg_sleep_quality: number | null;
  total_workouts: number;
  avg_hydration_ml: number;
  hydration_goal_achievement: number;
  workout_goal_achievement: number;
  days_tracked: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: Record<string, any>;
}

export const healthApiService = {
  /**
   * Listar dados de saúde do usuário
   */
  async list(params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<HealthData[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const query = queryParams.toString();
      const endpoint = query ? `/health/data?${query}` : '/health/data';

      return await api.get<HealthData[]>(endpoint);
    } catch (error) {
      console.error('Erro ao listar dados de saúde:', error);
      return [];
    }
  },

  /**
   * Buscar dados de saúde de hoje
   */
  async getToday(): Promise<HealthData | null> {
    try {
      return await api.get<HealthData>('/health/data/today');
    } catch (error) {
      console.error('Erro ao buscar dados de saúde de hoje:', error);
      return null;
    }
  },

  /**
   * Buscar dados de saúde por data
   */
  async getByDate(date: string): Promise<HealthData | null> {
    try {
      return await api.get<HealthData>(`/health/data/${date}`);
    } catch (error) {
      console.error('Erro ao buscar dados de saúde por data:', error);
      return null;
    }
  },

  /**
   * Criar ou atualizar dados de saúde
   */
  async create(data: HealthDataCreate): Promise<HealthData> {
    return await api.post<HealthData>('/health/data', data);
  },

  /**
   * Atualizar dados de saúde por ID
   */
  async update(id: number, data: HealthDataUpdate): Promise<HealthData> {
    return await api.put<HealthData>(`/health/data/${id}`, data);
  },

  /**
   * Deletar dados de saúde
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/health/data/${id}`);
  },

  /**
   * Buscar estatísticas de saúde
   */
  async getStats(days: number = 30): Promise<HealthStats | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('days', days.toString());

      return await api.get<HealthStats>(`/health/stats?${queryParams.toString()}`);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de saúde:', error);
      return null;
    }
  },

  /**
   * Verificar saúde do sistema
   */
  async checkSystemHealth(): Promise<HealthCheckResponse | null> {
    try {
      return await api.get<HealthCheckResponse>('/health/check', { auth: false });
    } catch (error) {
      console.error('Erro ao verificar saúde do sistema:', error);
      return null;
    }
  },

  /**
   * Verificar saúde de um serviço específico
   */
  async checkServiceHealth(service: string): Promise<any> {
    try {
      return await api.get(`/health/check/${service}`, { auth: false });
    } catch (error) {
      console.error(`Erro ao verificar saúde do serviço ${service}:`, error);
      return null;
    }
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkHealthDataTableExists(): Promise<boolean> {
    return true;
  }
};
