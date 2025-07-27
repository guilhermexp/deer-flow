import type { HealthData as AppHealthData } from "~/lib/health-data"
import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"

type SupabaseHealthData = Database['public']['Tables']['health_data']['Row']
type SupabaseHealthDataInsert = Database['public']['Tables']['health_data']['Insert']
type SupabaseHealthDataUpdate = Database['public']['Tables']['health_data']['Update']

// Converter formato da aplicação para formato Supabase
export function convertAppToSupabase(data: Partial<AppHealthData>, userId: string): SupabaseHealthDataInsert {
  return {
    date: new Date().toISOString().split('T')[0],
    health_score: data.score,
    hydration_ml: data.hydration?.current,
    hydration_goal_ml: data.hydration?.goal,
    sleep_hours: data.sleep?.duration,
    sleep_quality: data.sleep?.quality,
    blood_pressure_systolic: data.bloodPressure?.systolic,
    blood_pressure_diastolic: data.bloodPressure?.diastolic,
    pulse: data.bloodPressure?.pulse,
    workouts_completed: data.workout?.weeklyCompleted,
    workouts_goal: data.workout?.weeklyGoal,
    sleep_phases: data.sleep?.phases,
    medications: data.medications,
    user_id: userId
  }
}

// Converter formato Supabase para formato da aplicação
export function convertSupabaseToApp(data: SupabaseHealthData): AppHealthData {
  return {
    score: data.health_score || 85,
    hydration: {
      current: data.hydration_ml || 0,
      goal: data.hydration_goal_ml || 2000,
      history: []
    },
    sleep: {
      duration: data.sleep_hours || 0,
      quality: data.sleep_quality || 0,
      bedTime: '23:00',
      wakeTime: '06:30',
      phases: data.sleep_phases as any || {
        deep: 0,
        light: 0,
        rem: 0,
        awake: 0
      }
    },
    bloodPressure: {
      systolic: data.blood_pressure_systolic || 120,
      diastolic: data.blood_pressure_diastolic || 80,
      pulse: data.pulse || 72,
      history: []
    },
    workout: {
      nextWorkout: {
        time: '18:00',
        type: 'Treino de Força',
        duration: 60,
        intensity: 'Moderada'
      },
      weeklyGoal: data.workouts_goal || 5,
      weeklyCompleted: data.workouts_completed || 0
    },
    medications: (data.medications as any[]) || []
  }
}

// Helper para obter o usuário atual
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    // Error getting session
    throw new Error('Usuário não autenticado');
  }
  
  // Verificar se o user existe e tem id
  if (!session.user?.id) {
    // Invalid session
    throw new Error('Sessão de usuário inválida');
  }
  
  return session.user;
}

export const healthService = {
  // Buscar dados de saúde de hoje
  async getTodayHealthData(): Promise<AppHealthData | null> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const today = new Date().toISOString().split('T')[0];
    
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id!)
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      // Se for erro de RLS, retornar null ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        return null;
      }
      throw error;
    }
    
    return data ? convertSupabaseToApp(data) : null;
  },
  
  // Buscar dados de saúde por data
  async getHealthDataByDate(date: string): Promise<AppHealthData | null> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id!)
      .eq('date', date)
      .maybeSingle();
    
    if (error) {
      // Se for erro de RLS, retornar null ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        return null;
      }
      throw error;
    }
    
    return data ? convertSupabaseToApp(data) : null;
  },
  
  // Criar dados de saúde para hoje
  async createTodayHealthData(healthData?: Partial<AppHealthData>): Promise<AppHealthData> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Dados padrão
    const defaultData: AppHealthData = {
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
    };
    
    // Mesclar dados padrão com dados fornecidos
    const mergedData = healthData ? { ...defaultData, ...healthData } : defaultData;
    
    // Converter para formato Supabase
    const supabaseData = convertAppToSupabase(mergedData, user.id!);
    
    // Tentar inserir, mas usar upsert se já existir
    const { data, error } = await supabase
      .from('health_data')
      .upsert(supabaseData, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      // Se for erro de RLS, retornar dados padrão ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        return mergedData;
      }
      throw error;
    }
    
    return convertSupabaseToApp(data);
  },
  
  // Atualizar dados de saúde
  async updateHealthData(updates: Partial<AppHealthData>): Promise<AppHealthData> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Verificar se já existem dados para hoje
    const today = new Date().toISOString().split('T')[0];
    let existingData;
    
    try {
      const { data } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id!)
        .eq('date', today)
        .maybeSingle();
      
      existingData = data;
    } catch (error) {
      console.error('Erro ao verificar dados existentes:', error);
      // Continuar mesmo se houver erro
    }
    
    // Se não existirem dados, criar novos
    if (!existingData) {
      return this.createTodayHealthData(updates);
    }
    
    // Converter para formato Supabase
    const supabaseUpdates: SupabaseHealthDataUpdate = {};
    
    if (updates.score !== undefined) supabaseUpdates.health_score = updates.score;
    if (updates.hydration?.current !== undefined) supabaseUpdates.hydration_ml = updates.hydration.current;
    if (updates.hydration?.goal !== undefined) supabaseUpdates.hydration_goal_ml = updates.hydration.goal;
    if (updates.sleep?.duration !== undefined) supabaseUpdates.sleep_hours = updates.sleep.duration;
    if (updates.sleep?.quality !== undefined) supabaseUpdates.sleep_quality = updates.sleep.quality;
    if (updates.sleep?.phases !== undefined) supabaseUpdates.sleep_phases = updates.sleep.phases;
    if (updates.bloodPressure?.systolic !== undefined) supabaseUpdates.blood_pressure_systolic = updates.bloodPressure.systolic;
    if (updates.bloodPressure?.diastolic !== undefined) supabaseUpdates.blood_pressure_diastolic = updates.bloodPressure.diastolic;
    if (updates.bloodPressure?.pulse !== undefined) supabaseUpdates.pulse = updates.bloodPressure.pulse;
    if (updates.workout?.weeklyCompleted !== undefined) supabaseUpdates.workouts_completed = updates.workout.weeklyCompleted;
    if (updates.workout?.weeklyGoal !== undefined) supabaseUpdates.workouts_goal = updates.workout.weeklyGoal;
    if (updates.medications !== undefined) supabaseUpdates.medications = updates.medications;
    
    // Atualizar no banco
    const { data, error } = await supabase
      .from('health_data')
      .update(supabaseUpdates)
      .eq('id', existingData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar dados de saúde:', error);
      throw error;
    }
    
    return convertSupabaseToApp(data);
  },
  
  // Buscar histórico de saúde
  async getHealthHistory(days = 7): Promise<AppHealthData[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id!)
      .gte('date', startDateStr)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar histórico de saúde:', error);
      throw error;
    }
    
    return (data || []).map(convertSupabaseToApp);
  },
  
  // Verificar se a tabela health_data existe
  async checkHealthTableExists(): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      // Verificação rápida sem timeout manual
      const { error } = await supabase
        .from('health_data')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // Se o erro for sobre a tabela não existir, retorna false
      if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        return false;
      }
      
      // Se não houver erro ou for outro tipo de erro (como permissão), assume que a tabela existe
      return true;
    } catch (error) {
      console.error('Erro ao verificar tabela health_data:', error);
      // Em caso de erro, assumir que a tabela existe
      return true;
    }
  },
  
  // Criar tabela health_data se não existir
  async createHealthTableIfNotExists(): Promise<void> {
    const supabase = getSupabaseClient();
    
    try {
      // Verificar se a tabela existe
      const exists = await this.checkHealthTableExists();
      
      if (!exists) {
        console.log('⚠️ Tabela health_data não encontrada');
        console.log('📋 Por favor, execute o script de setup:');
        console.log('   cd web && node scripts/setup-supabase-complete.js');
        console.log('   Ou acesse o SQL Editor do Supabase e execute o SQL de criação das tabelas');
        
        // Retornar sem erro para permitir fallback
        return;
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível verificar/criar tabela health_data:', error);
      // Não lançar erro para permitir uso com dados mockados
    }
  },

  // Adicionar água
  async addWaterIntake(amount: number): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    
    if (!currentData) {
      // Se não existem dados, criar com a quantidade de água
      return this.createTodayHealthData({
        hydration: {
          current: amount,
          goal: 2000,
          history: []
        }
      });
    }
    
    // Atualizar dados existentes
    const newAmount = (currentData.hydration?.current || 0) + amount;
    return this.updateHealthData({
      hydration: {
        ...currentData.hydration,
        current: newAmount
      }
    });
  },

  // Calcular e atualizar score de saúde
  async calculateHealthScore(): Promise<void> {
    const currentData = await this.getTodayHealthData();
    
    if (!currentData) {
      return;
    }
    
    // Lógica simples de cálculo de score
    let score = 0;
    
    // Hidratação (30 pontos máximo)
    const hydrationRatio = (currentData.hydration?.current || 0) / (currentData.hydration?.goal || 2000);
    score += Math.min(hydrationRatio * 30, 30);
    
    // Sono (30 pontos máximo)
    const sleepHours = currentData.sleep?.duration || 0;
    if (sleepHours >= 7 && sleepHours <= 9) {
      score += 30;
    } else if (sleepHours >= 6 && sleepHours <= 10) {
      score += 20;
    } else if (sleepHours > 0) {
      score += 10;
    }
    
    // Exercícios (20 pontos máximo)
    const workoutRatio = (currentData.workout?.weeklyCompleted || 0) / (currentData.workout?.weeklyGoal || 5);
    score += Math.min(workoutRatio * 20, 20);
    
    // Qualidade do sono (10 pontos máximo)
    const sleepQuality = currentData.sleep?.quality || 0;
    score += (sleepQuality / 5) * 10;
    
    // Pressão arterial (10 pontos máximo)
    const systolic = currentData.bloodPressure?.systolic || 120;
    const diastolic = currentData.bloodPressure?.diastolic || 80;
    if (systolic >= 90 && systolic <= 140 && diastolic >= 60 && diastolic <= 90) {
      score += 10;
    } else {
      score += 5;
    }
    
    // Arredondar para inteiro
    const finalScore = Math.round(Math.max(0, Math.min(100, score)));
    
    // Atualizar score
    await this.updateHealthData({ score: finalScore });
  },

  // Atualizar dados de sono
  async updateSleepData(duration: number, quality: number): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    
    const sleepData = {
      duration,
      quality,
      bedTime: currentData?.sleep?.bedTime || '23:00',
      wakeTime: currentData?.sleep?.wakeTime || '06:30',
      phases: currentData?.sleep?.phases || {
        deep: 0,
        light: 0,
        rem: 0,
        awake: 0
      }
    };
    
    if (!currentData) {
      return this.createTodayHealthData({
        sleep: sleepData
      });
    }
    
    return this.updateHealthData({
      sleep: sleepData
    });
  },

  // Atualizar pressão arterial
  async updateBloodPressure(systolic: number, diastolic: number, pulse: number): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    
    const bloodPressureData = {
      systolic,
      diastolic,
      pulse,
      history: currentData?.bloodPressure?.history || []
    };
    
    if (!currentData) {
      return this.createTodayHealthData({
        bloodPressure: bloodPressureData
      });
    }
    
    return this.updateHealthData({
      bloodPressure: bloodPressureData
    });
  },

  // Alternar medicação
  async toggleMedication(medicationName: string): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    const medications = currentData?.medications || [];
    
    const existingIndex = medications.findIndex(med => med.name === medicationName);
    let updatedMedications;
    
    if (existingIndex >= 0) {
      // Toggle taken status
      updatedMedications = medications.map((med, index) => 
        index === existingIndex ? { ...med, taken: !med.taken } : med
      );
    } else {
      // Add new medication
      updatedMedications = [...medications, { name: medicationName, taken: true, time: '08:00' }];
    }
    
    if (!currentData) {
      return this.createTodayHealthData({
        medications: updatedMedications
      });
    }
    
    return this.updateHealthData({
      medications: updatedMedications
    });
  },

  // Adicionar medicação
  async addMedication(medicationName: string, time: string): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    const medications = currentData?.medications || [];
    
    const newMedication = { name: medicationName, taken: false, time };
    const updatedMedications = [...medications, newMedication];
    
    if (!currentData) {
      return this.createTodayHealthData({
        medications: updatedMedications
      });
    }
    
    return this.updateHealthData({
      medications: updatedMedications
    });
  },

  // Remover medicação
  async removeMedication(medicationName: string): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    const medications = currentData?.medications || [];
    
    const updatedMedications = medications.filter(med => med.name !== medicationName);
    
    if (!currentData) {
      return this.createTodayHealthData({
        medications: updatedMedications
      });
    }
    
    return this.updateHealthData({
      medications: updatedMedications
    });
  },

  // Completar treino
  async completeWorkout(): Promise<AppHealthData> {
    const currentData = await this.getTodayHealthData();
    const currentCompleted = currentData?.workout?.weeklyCompleted || 0;
    
    const workoutData = {
      nextWorkout: currentData?.workout?.nextWorkout || {
        time: '18:00',
        type: 'Treino de Força',
        duration: 60,
        intensity: 'Moderada'
      },
      weeklyGoal: currentData?.workout?.weeklyGoal || 5,
      weeklyCompleted: currentCompleted + 1
    };
    
    if (!currentData) {
      return this.createTodayHealthData({
        workout: workoutData
      });
    }
    
    return this.updateHealthData({
      workout: workoutData
    });
  }
};

// Export HealthData type for compatibility
export type HealthData = AppHealthData;