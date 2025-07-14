// Supabase Database Types for Deep-flow
// Auto-generated types can be generated using: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type UserRole = 'user' | 'admin'
export type MessageRole = 'user' | 'assistant' | 'system'
export type ResearchStatus = 'planning' | 'executing' | 'completed' | 'failed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type ContentType = 'podcast' | 'ppt' | 'report'
export type ReportStyle = 'ACADEMIC' | 'POPULAR_SCIENCE' | 'NEWS' | 'SOCIAL_MEDIA'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          thread_id: string
          title: string | null
          query: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          thread_id: string
          title?: string | null
          query?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          metadata?: Json
        }
        Update: {
          title?: string | null
          query?: string | null
          is_archived?: boolean
          metadata?: Json
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          agent: string | null
          role: MessageRole
          content: string | null
          reasoning_content: string | null
          tool_calls: Json | null
          resources: Json | null
          finish_reason: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          conversation_id: string
          agent?: string | null
          role: MessageRole
          content?: string | null
          reasoning_content?: string | null
          tool_calls?: Json | null
          resources?: Json | null
          finish_reason?: string | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          agent?: string | null
          role?: MessageRole
          content?: string | null
          reasoning_content?: string | null
          tool_calls?: Json | null
          resources?: Json | null
          finish_reason?: string | null
          metadata?: Json
        }
      }
      research_activities: {
        Row: {
          id: string
          conversation_id: string
          activity_type: string
          description: string | null
          status: ResearchStatus
          results: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          activity_type: string
          description?: string | null
          status?: ResearchStatus
          results?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          activity_type?: string
          description?: string | null
          status?: ResearchStatus
          results?: Json | null
          completed_at?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          media_type: string | null
          media_source: string | null
          media_url: string | null
          content: string | null
          transcript: string | null
          summary: string | null
          ai_processed: boolean
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          media_type?: string | null
          media_source?: string | null
          media_url?: string | null
          content?: string | null
          transcript?: string | null
          summary?: string | null
          ai_processed?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          title?: string
          media_type?: string | null
          media_source?: string | null
          media_url?: string | null
          content?: string | null
          transcript?: string | null
          summary?: string | null
          ai_processed?: boolean
          updated_at?: string
          metadata?: Json
        }
      }
      note_sessions: {
        Row: {
          id: string
          note_id: string
          session_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          note_id: string
          session_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_name?: string
          updated_at?: string
        }
      }
      note_messages: {
        Row: {
          id: string
          session_id: string
          role: MessageRole
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: MessageRole
          content: string
          created_at?: string
        }
        Update: {
          role?: MessageRole
          content?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          all_day: boolean
          color: string | null
          recurrence_rule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          all_day?: boolean
          color?: string | null
          recurrence_rule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          all_day?: boolean
          color?: string | null
          recurrence_rule?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          columns: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          columns?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          columns?: Json
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          column_id: string
          position: number
          priority: TaskPriority
          due_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          column_id: string
          position: number
          priority?: TaskPriority
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          column_id?: string
          position?: number
          priority?: TaskPriority
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          updated_at?: string
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          metric_type: string
          value: Json
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_type: string
          value: Json
          recorded_at: string
          created_at?: string
        }
        Update: {
          metric_type?: string
          value?: Json
          recorded_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          general_settings: Json
          mcp_servers: Json
          report_style: ReportStyle
          enable_deep_thinking: boolean
          enable_background_investigation: boolean
          max_search_results: number
          max_plan_iterations: number
          max_step_num: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          general_settings?: Json
          mcp_servers?: Json
          report_style?: ReportStyle
          enable_deep_thinking?: boolean
          enable_background_investigation?: boolean
          max_search_results?: number
          max_plan_iterations?: number
          max_step_num?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          general_settings?: Json
          mcp_servers?: Json
          report_style?: ReportStyle
          enable_deep_thinking?: boolean
          enable_background_investigation?: boolean
          max_search_results?: number
          max_plan_iterations?: number
          max_step_num?: number
          updated_at?: string
        }
      }
      generated_content: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          content_type: ContentType
          file_url: string | null
          file_size: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          content_type: ContentType
          file_url?: string | null
          file_size?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          conversation_id?: string | null
          content_type?: ContentType
          file_url?: string | null
          file_size?: number | null
          metadata?: Json
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          method: string
          status_code: number | null
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          method: string
          status_code?: number | null
          response_time_ms?: number | null
          created_at?: string
        }
        Update: {
          endpoint?: string
          method?: string
          status_code?: number | null
          response_time_ms?: number | null
        }
      }
    }
    Views: {
      conversation_summary: {
        Row: {
          id: string
          user_id: string
          thread_id: string
          title: string | null
          query: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          message_count: number
          last_message_at: string | null
        }
      }
    }
    Functions: {
      get_user_statistics: {
        Args: { user_uuid: string }
        Returns: {
          total_conversations: number
          total_messages: number
          total_notes: number
          total_events: number
          total_tasks: number
          total_projects: number
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      message_role: MessageRole
      research_status: ResearchStatus
      task_priority: TaskPriority
      content_type: ContentType
      report_style: ReportStyle
    }
  }
}

// Helper types for better developer experience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type UserProfile = Tables<'user_profiles'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type ResearchActivity = Tables<'research_activities'>
export type Note = Tables<'notes'>
export type NoteSession = Tables<'note_sessions'>
export type NoteMessage = Tables<'note_messages'>
export type CalendarEvent = Tables<'calendar_events'>
export type Project = Tables<'projects'>
export type Task = Tables<'tasks'>
export type HealthMetric = Tables<'health_metrics'>
export type UserSettings = Tables<'user_settings'>
export type GeneratedContent = Tables<'generated_content'>
export type ApiUsage = Tables<'api_usage'>

// View types
export type ConversationSummary = Database['public']['Views']['conversation_summary']['Row']

// Function return types
export type UserStatistics = Database['public']['Functions']['get_user_statistics']['Returns'][0]

// Additional types for the application
export interface User {
  id: string
  email: string
  profile?: UserProfile
}

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface Resource {
  id: string
  name: string
  description: string
  url?: string
  metadata?: Record<string, any>
}

export interface KanbanColumn {
  id: string
  name: string
  color?: string
}

export interface HealthMetricValue {
  [key: string]: any
  value?: number
  unit?: string
  timestamp?: string
}