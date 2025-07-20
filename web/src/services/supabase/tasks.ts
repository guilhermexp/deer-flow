// Task Service for Supabase
import { getSupabaseClient } from '~/lib/supabase/client'

export interface Task {
  id: string;
  user_id: string;
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

export const taskService = {
  async getTasks(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Task[];
  },

  async createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient();
    
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('No active session');
    }
    
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: user.data.user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  },

  async deleteTask(id: string) {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getTaskStats() {
    const supabase = getSupabaseClient();
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, due_date');
    
    if (error) throw error;
    
    const now = new Date();
    const stats = {
      total_tasks: tasks?.length || 0,
      completed_tasks: tasks?.filter(t => t.status === 'done').length || 0,
      pending_tasks: tasks?.filter(t => t.status !== 'done').length || 0,
      overdue_tasks: tasks?.filter(t => 
        t.status !== 'done' && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length || 0,
    };
    
    return stats;
  }
};