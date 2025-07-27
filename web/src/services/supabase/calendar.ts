import type { CalendarEvent as AppCalendarEvent, NewEventFormData } from "~/components/jarvis/calendar/lib/types"
import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"

type SupabaseCalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type SupabaseCalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert']
type SupabaseCalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update']

// Helper para formatar a hora
const formatHourForDisplay = (hour: number): string => {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}

// Converter formato da aplicação para formato Supabase
export function convertAppToSupabase(eventData: NewEventFormData, userId: string): SupabaseCalendarEventInsert {
  const parts = eventData.eventDate.split("-").map(Number)
  const year = parts[0] ?? new Date().getFullYear()
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  
  const startDate = new Date(year, month - 1, day, eventData.startHour, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(startDate.getHours() + eventData.duration)
  
  return {
    title: eventData.title,
    description: eventData.subtitle,
    date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    category: eventData.category,
    color: eventData.color,
    is_all_day: false,
    user_id: userId
  }
}

// Converter formato Supabase para formato da aplicação
export function convertSupabaseToApp(supabaseEvent: SupabaseCalendarEvent): AppCalendarEvent {
  const eventDate = new Date(supabaseEvent.date)
  
  // Log para debug
  console.log('🔄 Convertendo evento:', {
    id: supabaseEvent.id,
    title: supabaseEvent.title,
    date: supabaseEvent.date,
    eventDate: eventDate.toString(),
    day: eventDate.getDay(),
    hour: eventDate.getHours()
  });
  
  let dayOfWeek = eventDate.getDay() - 1 // Mon=0, Sun=6
  if (dayOfWeek === -1) dayOfWeek = 6 // Adjust Sunday
  
  const startHour = eventDate.getHours()
  
  // Calculate duration if end_date is provided
  let duration = 1 // Default 1 hour
  if (supabaseEvent.end_date) {
    const endDate = new Date(supabaseEvent.end_date)
    duration = Math.max(1, Math.round((endDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60)))
  }
  
  return {
    id: supabaseEvent.id,
    title: supabaseEvent.title,
    subtitle: supabaseEvent.description || undefined,
    time: formatHourForDisplay(startHour),
    duration,
    color: (supabaseEvent.color || "blue") as "blue" | "green" | "purple" | "orange" | "red",
    category: (supabaseEvent.category || "all") as "all" | "rotina" | "habitos" | "workout" | "lembretes",
    day: dayOfWeek,
    startHour,
    date: supabaseEvent.date,
  }
}

// Helper para obter o usuário atual
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Usuário não autenticado');
  }
  
  return session.user;
}

export const calendarService = {
  // Buscar eventos
  async getEvents(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
  }): Promise<AppCalendarEvent[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);
    
    if (params?.start_date) {
      query = query.gte('date', params.start_date);
    }
    
    if (params?.end_date) {
      query = query.lte('date', params.end_date);
    }
    
    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    
    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
    
    console.log('🗓️ Eventos encontrados no Supabase:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📅 Primeiro evento do Supabase:', data[0]);
      console.log('🔄 Convertendo eventos...');
    }
    
    const convertedEvents = (data || []).map(convertSupabaseToApp);
    console.log('✅ Eventos convertidos:', convertedEvents.length);
    if (convertedEvents.length > 0) {
      console.log('📋 Primeiro evento convertido:', convertedEvents[0]);
    }
    
    return convertedEvents;
  },
  
  // Buscar evento por ID
  async getEvent(eventId: string): Promise<AppCalendarEvent | null> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar evento:', error);
      throw error;
    }
    
    return data ? convertSupabaseToApp(data) : null;
  },
  
  // Criar evento
  async createEvent(eventData: NewEventFormData): Promise<AppCalendarEvent> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const supabaseEvent = convertAppToSupabase(eventData, user.id);
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(supabaseEvent)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
    
    return convertSupabaseToApp(data);
  },
  
  // Atualizar evento
  async updateEvent(eventId: string, updates: Partial<AppCalendarEvent>): Promise<AppCalendarEvent> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const supabaseUpdates: SupabaseCalendarEventUpdate = {};
    
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.subtitle !== undefined) supabaseUpdates.description = updates.subtitle;
    if (updates.color !== undefined) supabaseUpdates.color = updates.color;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    
    // Se houver mudanças na data ou duração, recalcular as datas
    if (updates.date || updates.startHour !== undefined || updates.duration !== undefined) {
      const { data: currentEvent } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', user.id)
        .single();
      
      if (currentEvent) {
        const startDate = updates.date ? new Date(updates.date) : new Date(currentEvent.date);
        
        if (updates.startHour !== undefined) {
          startDate.setHours(updates.startHour);
        }
        
        const endDate = new Date(startDate);
        const duration = updates.duration !== undefined ? updates.duration : 
          (currentEvent.end_date ? 
            Math.round((new Date(currentEvent.end_date).getTime() - new Date(currentEvent.date).getTime()) / (1000 * 60 * 60)) : 
            1);
        
        endDate.setHours(startDate.getHours() + duration);
        
        supabaseUpdates.date = startDate.toISOString();
        supabaseUpdates.end_date = endDate.toISOString();
      }
    }
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update(supabaseUpdates)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
    
    return convertSupabaseToApp(data);
  },
  
  // Excluir evento
  async deleteEvent(eventId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  },
  
  // Buscar eventos por mês
  async getEventsByMonth(year: number, month: number): Promise<AppCalendarEvent[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Calcular datas de início e fim do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último dia do mês
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar eventos do mês:', error);
      throw error;
    }
    
    return (data || []).map(convertSupabaseToApp);
  },
  
  // Verificar se a tabela calendar_events existe
  async checkCalendarTableExists(): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('calendar_events')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Erro ao verificar tabela calendar_events:', error);
      return false;
    }
  }
};