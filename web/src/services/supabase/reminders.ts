// Reminder Service for Supabase
import { getSupabaseClient } from '~/lib/supabase/client'

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  time?: string;
  date?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const reminderService = {
  async getReminders(filters?: {
    date?: string;
    is_completed?: boolean;
    limit?: number;
  }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('reminders')
      .select('*')
      .order('date', { ascending: true });
    
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());
    }
    if (filters?.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Reminder[];
  },

  async getTodayReminders() {
    const today = new Date().toISOString().split('T')[0];
    return this.getReminders({ date: today, is_completed: false, limit: 5 });
  },

  async createReminder(reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient();
    
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('No active session');
    }
    
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        ...reminder,
        user_id: user.data.user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Reminder;
  },

  async updateReminder(id: string, updates: Partial<Reminder>) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Reminder;
  },

  async deleteReminder(id: string) {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getReminderStats() {
    const supabase = getSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayReminders, error: todayError } = await supabase
      .from('reminders')
      .select('*')
      .gte('date', today.toISOString())
      .lt('date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .eq('is_completed', false);
    
    if (todayError) throw todayError;
    
    const { data: upcomingReminders, error: upcomingError } = await supabase
      .from('reminders')
      .select('*')
      .gte('date', new Date().toISOString())
      .eq('is_completed', false);
    
    if (upcomingError) throw upcomingError;
    
    return {
      today_reminders: todayReminders?.length || 0,
      upcoming_reminders: upcomingReminders?.length || 0,
    };
  }
};