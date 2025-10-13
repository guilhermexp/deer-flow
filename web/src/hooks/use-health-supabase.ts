import { useState, useEffect, useCallback } from 'react';

import { useUser } from '@clerk/nextjs';
import type { HealthData } from '~/lib/health-data';
import { healthApiService as healthService } from '~/services/api/health';

/**
 * Hook para gerenciar dados de saúde via REST API
 */
export function useHealthSupabase() {
  const { user, isLoaded } = useUser();
  const isAuthenticated = isLoaded && !!user;
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados de saúde do Supabase
  const loadHealthData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setHealthData(null);
      setLoading(false);
      return;
    }

    // Adicionar timeout para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout ao carregar dados de saúde, usando dados padrão');
      setHealthData({
        score: 85,
        hydration: {
          current: 0,
          goal: 2000,
          history: []
        },
        sleep: {
          duration: 0,
          quality: 0,
          bedTime: '23:00',
          wakeTime: '06:30',
          phases: {
            deep: 0,
            light: 0,
            rem: 0,
            awake: 0
          }
        },
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          history: []
        },
        workout: {
          nextWorkout: {
            time: '18:00',
            type: 'Treino de Força',
            duration: 60,
            intensity: 'Moderada'
          },
          weeklyGoal: 5,
          weeklyCompleted: 0
        },
        medications: []
      });
      setLoading(false);
      setError('Timeout ao carregar dados. Usando dados padrão.');
    }, 5000); // 5 segundos de timeout

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando dados de saúde...');

      // Buscar dados de hoje via API
      let todayData = await healthService.getToday();

      // Se não existirem dados para hoje, criar com dados padrão
      if (!todayData) {
        console.log('📝 Criando dados de saúde para hoje...');
        todayData = await healthService.create({});
      }

      console.log('✅ Dados de saúde carregados com sucesso');

      // Converter dados da API para o formato local (simplificado)
      const localData: HealthData = {
        score: todayData.health_score || 85,
        hydration: {
          current: todayData.hydration_ml,
          goal: todayData.hydration_goal_ml,
          history: []
        },
        sleep: {
          duration: todayData.sleep_hours || 0,
          quality: todayData.sleep_quality || 0,
          bedTime: '23:00',
          wakeTime: '06:30',
          phases: (todayData.sleep_phases as any) || { deep: 0, light: 0, rem: 0, awake: 0 }
        },
        bloodPressure: {
          systolic: todayData.blood_pressure_systolic || 120,
          diastolic: todayData.blood_pressure_diastolic || 80,
          pulse: todayData.pulse || 72,
          history: []
        },
        workout: {
          nextWorkout: {
            time: '18:00',
            type: 'Treino de Força',
            duration: 60,
            intensity: 'Moderada'
          },
          weeklyGoal: todayData.workouts_goal,
          weeklyCompleted: todayData.workouts_completed
        },
        medications: (todayData.medications as any[]) || []
      };
      setHealthData(localData);
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('❌ Erro ao carregar dados de saúde:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de saúde');
      clearTimeout(timeoutId);
      
      // Criar dados padrão em caso de erro
      setHealthData({
        score: 85,
        hydration: {
          current: 0,
          goal: 2000,
          history: []
        },
        sleep: {
          duration: 0,
          quality: 0,
          bedTime: '23:00',
          wakeTime: '06:30',
          phases: {
            deep: 0,
            light: 0,
            rem: 0,
            awake: 0
          }
        },
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          history: []
        },
        workout: {
          nextWorkout: {
            time: '18:00',
            type: 'Treino de Força',
            duration: 60,
            intensity: 'Moderada'
          },
          weeklyGoal: 5,
          weeklyCompleted: 0
        },
        medications: []
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Atualizar dados de saúde
  const updateHealthData = useCallback(async (updates: Partial<HealthData>) => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Converter updates locais para formato da API
      const apiUpdates: any = {};
      if (updates.score !== undefined) apiUpdates.health_score = updates.score;
      if (updates.hydration) {
        if (updates.hydration.current !== undefined) apiUpdates.hydration_ml = updates.hydration.current;
        if (updates.hydration.goal !== undefined) apiUpdates.hydration_goal_ml = updates.hydration.goal;
      }
      if (updates.sleep) {
        if (updates.sleep.duration !== undefined) apiUpdates.sleep_hours = updates.sleep.duration;
        if (updates.sleep.quality !== undefined) apiUpdates.sleep_quality = updates.sleep.quality;
        if (updates.sleep.phases) apiUpdates.sleep_phases = updates.sleep.phases;
      }
      if (updates.bloodPressure) {
        if (updates.bloodPressure.systolic !== undefined) apiUpdates.blood_pressure_systolic = updates.bloodPressure.systolic;
        if (updates.bloodPressure.diastolic !== undefined) apiUpdates.blood_pressure_diastolic = updates.bloodPressure.diastolic;
        if (updates.bloodPressure.pulse !== undefined) apiUpdates.pulse = updates.bloodPressure.pulse;
      }
      if (updates.workout) {
        if (updates.workout.weeklyGoal !== undefined) apiUpdates.workouts_goal = updates.workout.weeklyGoal;
        if (updates.workout.weeklyCompleted !== undefined) apiUpdates.workouts_completed = updates.workout.weeklyCompleted;
      }
      if (updates.medications) apiUpdates.medications = updates.medications;

      // Buscar dados de hoje para pegar o ID
      const todayData = await healthService.getToday();
      if (todayData) {
        await healthService.update(todayData.id, apiUpdates);
      }

      // Atualizar estado local
      if (healthData) {
        const updatedData = { ...healthData };

        if (updates.score !== undefined) updatedData.score = updates.score;
        if (updates.hydration) updatedData.hydration = { ...updatedData.hydration, ...updates.hydration };
        if (updates.sleep) updatedData.sleep = { ...updatedData.sleep, ...updates.sleep };
        if (updates.bloodPressure) updatedData.bloodPressure = { ...updatedData.bloodPressure, ...updates.bloodPressure };
        if (updates.workout) updatedData.workout = { ...updatedData.workout, ...updates.workout };
        if (updates.medications) updatedData.medications = updates.medications;

        setHealthData(updatedData);
        return updatedData;
      }

      return null;
    } catch (err) {
      console.error('❌ Erro ao atualizar dados de saúde:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados de saúde');

      // Atualizar localmente mesmo em caso de erro
      if (healthData) {
        const updatedData = { ...healthData };

        if (updates.score !== undefined) updatedData.score = updates.score;
        if (updates.hydration) updatedData.hydration = { ...updatedData.hydration, ...updates.hydration };
        if (updates.sleep) updatedData.sleep = { ...updatedData.sleep, ...updates.sleep };
        if (updates.bloodPressure) updatedData.bloodPressure = { ...updatedData.bloodPressure, ...updates.bloodPressure };
        if (updates.workout) updatedData.workout = { ...updatedData.workout, ...updates.workout };
        if (updates.medications) updatedData.medications = updates.medications;

        setHealthData(updatedData);
        return updatedData;
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [healthData, isAuthenticated, user?.id]);

  // Carregar dados ao montar ou quando o usuário mudar
  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Helper methods para atualizações específicas
  const handleAddWater = useCallback(async (amount: number) => {
    if (!healthData) return;
    
    const newCurrent = healthData.hydration.current + amount;
    await updateHealthData({ 
      hydration: {
        ...healthData.hydration,
        current: newCurrent
      }
    });
  }, [healthData, updateHealthData]);

  const handleUpdateSleep = useCallback(async (sleepData: any) => {
    await updateHealthData({ sleep: sleepData });
  }, [updateHealthData]);

  const handleUpdateBloodPressure = useCallback(async (bpData: any) => {
    await updateHealthData({ bloodPressure: bpData });
  }, [updateHealthData]);

  const handleToggleMedication = useCallback(async (index: number) => {
    if (!healthData?.medications[index]) return;
    
    const medication = healthData.medications[index];
    if (!medication) return;
    
    const updatedMeds = [...healthData.medications];
    updatedMeds[index] = { ...medication, taken: !medication.taken };
    
    await updateHealthData({ medications: updatedMeds });
  }, [healthData, updateHealthData]);

  const handleAddMedication = useCallback(async (name: string, dosage: string, time: string) => {
    if (!healthData) return;
    
    const newMedication = { name, dosage, time, taken: false };
    const updatedMeds = [...healthData.medications, newMedication];
    
    await updateHealthData({ medications: updatedMeds });
  }, [healthData, updateHealthData]);

  const handleRemoveMedication = useCallback(async (index: number) => {
    if (!healthData?.medications[index]) return;
    
    const updatedMeds = healthData.medications.filter((_, i) => i !== index);
    await updateHealthData({ medications: updatedMeds });
  }, [healthData, updateHealthData]);

  const handleCompleteWorkout = useCallback(async () => {
    if (!healthData) return;
    
    const completed = healthData.workout.weeklyCompleted + 1;
    await updateHealthData({ 
      workout: {
        ...healthData.workout,
        weeklyCompleted: completed
      }
    });
  }, [healthData, updateHealthData]);

  return {
    healthData,
    loading,
    error,
    loadHealthData,
    updateHealthData,
    handleAddWater,
    handleUpdateSleep,
    handleUpdateBloodPressure,
    handleToggleMedication,
    handleAddMedication,
    handleRemoveMedication,
    handleCompleteWorkout,
    isAuthenticated
  };
}