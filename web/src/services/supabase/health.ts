// Health Service for Supabase
import { getSupabaseClient } from '~/lib/supabase/client'

export interface HealthData {
  id: string;
  user_id: string;
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
  sleep_phases?: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    time: string;
    taken: boolean;
  }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to safely get current user
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  // First check if we have a session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No active session');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}

export const healthService = {
  async getTodayHealthData(): Promise<HealthData | null> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', today.toISOString())
      .lt('date', tomorrow.toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    
    // If no data for today, create default entry
    if (!data) {
      return await this.createTodayHealthData();
    }
    
    return data as HealthData;
  },

  async createTodayHealthData(): Promise<HealthData> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    const defaultData = {
      user_id: user.id,
      date: today.toISOString(),
      health_score: 85,
      hydration_ml: 0,
      hydration_goal_ml: 2000,
      sleep_hours: null,
      sleep_quality: null,
      workouts_completed: 0,
      workouts_goal: 5,
      medications: [
        { name: 'Vitamina D', dosage: '1000 UI', time: '08:00', taken: false },
        { name: 'Ômega 3', dosage: '1000mg', time: '08:00', taken: false },
        { name: 'Magnésio', dosage: '400mg', time: '20:00', taken: false },
      ]
    };
    
    const { data, error } = await supabase
      .from('health_data')
      .insert(defaultData)
      .select()
      .single();
    
    if (error) throw error;
    return data as HealthData;
  },

  async updateHealthData(updates: Partial<HealthData>): Promise<HealthData> {
    const supabase = getSupabaseClient();
    const today = await this.getTodayHealthData();
    
    if (!today) throw new Error('No health data found for today');
    
    const { data, error } = await supabase
      .from('health_data')
      .update(updates)
      .eq('id', today.id)
      .select()
      .single();
    
    if (error) throw error;
    return data as HealthData;
  },

  async addWaterIntake(amount: number): Promise<HealthData> {
    const today = await this.getTodayHealthData();
    if (!today) throw new Error('No health data found for today');
    
    const newAmount = (today.hydration_ml || 0) + amount;
    return this.updateHealthData({ hydration_ml: newAmount });
  },

  async updateSleepData(hours: number, quality: number): Promise<HealthData> {
    return this.updateHealthData({ 
      sleep_hours: hours, 
      sleep_quality: quality 
    });
  },

  async updateBloodPressure(systolic: number, diastolic: number, pulse: number): Promise<HealthData> {
    return this.updateHealthData({
      blood_pressure_systolic: systolic,
      blood_pressure_diastolic: diastolic,
      pulse: pulse
    });
  },

  async toggleMedication(index: number): Promise<HealthData> {
    const today = await this.getTodayHealthData();
    if (!today || !today.medications) throw new Error('No medications found');
    
    const medications = [...today.medications];
    if (medications[index]) {
      medications[index].taken = !medications[index].taken;
      return this.updateHealthData({ medications });
    }
    
    return today;
  },

  async addMedication(name: string, dosage: string, time: string): Promise<HealthData> {
    const today = await this.getTodayHealthData();
    if (!today) throw new Error('No health data found for today');
    
    const medications = [...(today.medications || [])];
    medications.push({ name, dosage, time, taken: false });
    
    return this.updateHealthData({ medications });
  },

  async removeMedication(index: number): Promise<HealthData> {
    const today = await this.getTodayHealthData();
    if (!today || !today.medications) throw new Error('No medications found');
    
    const medications = today.medications.filter((_, i) => i !== index);
    return this.updateHealthData({ medications });
  },

  async completeWorkout(): Promise<HealthData> {
    const today = await this.getTodayHealthData();
    if (!today) throw new Error('No health data found for today');
    
    const completed = (today.workouts_completed || 0) + 1;
    return this.updateHealthData({ workouts_completed: completed });
  },

  async getHealthHistory(days: number = 7): Promise<HealthData[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as HealthData[];
  },

  async calculateHealthScore(): Promise<number> {
    const today = await this.getTodayHealthData();
    if (!today) return 0;
    
    let score = 50; // Base score
    
    // Hydration (max 20 points)
    const hydrationPercent = today.hydration_ml / today.hydration_goal_ml;
    score += Math.min(20, hydrationPercent * 20);
    
    // Sleep (max 20 points)
    if (today.sleep_hours) {
      const sleepScore = today.sleep_hours >= 7 && today.sleep_hours <= 9 ? 20 : 10;
      score += sleepScore;
    }
    
    // Workouts (max 10 points)
    const workoutPercent = today.workouts_completed / today.workouts_goal;
    score += Math.min(10, workoutPercent * 10);
    
    // Update health score
    await this.updateHealthData({ health_score: Math.round(score) });
    
    return Math.round(score);
  }
};