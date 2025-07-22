import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"
import type { HealthData as AppHealthData } from "~/lib/health-data"

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
    console.error('Erro ao obter sessão:', error);
    throw new Error('Usuário não autenticado');
  }
  
  // Verificar se o user existe e tem id
  if (!session.user || !session.user.id) {
    console.error('Sessão inválida:', session);
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
    
    console.log('🔍 Buscando dados de saúde:', { userId: user.id, date: today });
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar dados de saúde:', error);
      // Se for erro de RLS, retornar null ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        console.warn('⚠️ Erro de RLS ao buscar dados de saúde, retornando null');
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
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar dados de saúde por data:', error);
      // Se for erro de RLS, retornar null ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        console.warn('⚠️ Erro de RLS ao buscar dados de saúde, retornando null');
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
    const supabaseData = convertAppToSupabase(mergedData, user.id);
    
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
      console.error('Erro ao criar dados de saúde:', error);
      // Se for erro de RLS, retornar dados padrão ao invés de lançar erro
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        console.warn('⚠️ Erro de RLS ao criar dados de saúde, retornando dados padrão');
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
        .eq('user_id', user.id)
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
  async getHealthHistory(days: number = 7): Promise<AppHealthData[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
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
  }
};