// Supabase Database Types for Deep-flow
// Auto-generated types - Updated with latest schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_usage: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          date: string
          description: string | null
          end_date: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          query: string | null
          thread_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          query?: string | null
          thread_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string | null
          thread_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          conversation_id: string | null
          created_at: string | null
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          conversation_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          conversation_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_data: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string | null
          date: string
          health_score: number | null
          hydration_goal_ml: number | null
          hydration_ml: number | null
          id: string
          medications: Json | null
          notes: string | null
          pulse: number | null
          sleep_hours: number | null
          sleep_phases: Json | null
          sleep_quality: number | null
          updated_at: string | null
          user_id: string
          workouts_completed: number | null
          workouts_goal: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          date: string
          health_score?: number | null
          hydration_goal_ml?: number | null
          hydration_ml?: number | null
          id?: string
          medications?: Json | null
          notes?: string | null
          pulse?: number | null
          sleep_hours?: number | null
          sleep_phases?: Json | null
          sleep_quality?: number | null
          updated_at?: string | null
          user_id: string
          workouts_completed?: number | null
          workouts_goal?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          date?: string
          health_score?: number | null
          hydration_goal_ml?: number | null
          hydration_ml?: number | null
          id?: string
          medications?: Json | null
          notes?: string | null
          pulse?: number | null
          sleep_hours?: number | null
          sleep_phases?: Json | null
          sleep_quality?: number | null
          updated_at?: string | null
          user_id?: string
          workouts_completed?: number | null
          workouts_goal?: number | null
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          recorded_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          recorded_at: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          recorded_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          agent: string | null
          content: string | null
          conversation_id: string
          created_at: string | null
          finish_reason: string | null
          id: string
          metadata: Json | null
          reasoning_content: string | null
          resources: Json | null
          role: Database["public"]["Enums"]["message_role"]
          tool_calls: Json | null
        }
        Insert: {
          agent?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          finish_reason?: string | null
          id?: string
          metadata?: Json | null
          reasoning_content?: string | null
          resources?: Json | null
          role: Database["public"]["Enums"]["message_role"]
          tool_calls?: Json | null
        }
        Update: {
          agent?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          finish_reason?: string | null
          id?: string
          metadata?: Json | null
          reasoning_content?: string | null
          resources?: Json | null
          role?: Database["public"]["Enums"]["message_role"]
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      note_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "note_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      note_sessions: {
        Row: {
          created_at: string | null
          id: string
          note_id: string
          session_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id: string
          session_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string
          session_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_sessions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          source: string | null
          source_url: string | null
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          time: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          time?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          time?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      research_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          conversation_id: string
          created_at: string | null
          description: string | null
          id: string
          results: Json | null
          status: Database["public"]["Enums"]["research_status"]
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          conversation_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          results?: Json | null
          status?: Database["public"]["Enums"]["research_status"]
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          results?: Json | null
          status?: Database["public"]["Enums"]["research_status"]
        }
        Relationships: [
          {
            foreignKeyName: "research_activities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_activities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          enable_background_investigation: boolean | null
          enable_deep_thinking: boolean | null
          general_settings: Json | null
          id: string
          max_plan_iterations: number | null
          max_search_results: number | null
          max_step_num: number | null
          mcp_servers: Json | null
          report_style: Database["public"]["Enums"]["report_style"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_background_investigation?: boolean | null
          enable_deep_thinking?: boolean | null
          general_settings?: Json | null
          id?: string
          max_plan_iterations?: number | null
          max_search_results?: number | null
          max_step_num?: number | null
          mcp_servers?: Json | null
          report_style?: Database["public"]["Enums"]["report_style"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_background_investigation?: boolean | null
          enable_deep_thinking?: boolean | null
          general_settings?: Json | null
          id?: string
          max_plan_iterations?: number | null
          max_search_results?: number | null
          max_step_num?: number | null
          mcp_servers?: Json | null
          report_style?: Database["public"]["Enums"]["report_style"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      conversation_summary: {
        Row: {
          created_at: string | null
          id: string | null
          last_message_at: string | null
          message_count: number | null
          query: string | null
          thread_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_api_usage: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
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
      refresh_conversation_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      content_type: "podcast" | "ppt" | "report"
      message_role: "user" | "assistant" | "system"
      report_style: "ACADEMIC" | "POPULAR_SCIENCE" | "NEWS" | "SOCIAL_MEDIA"
      research_status: "planning" | "executing" | "completed" | "failed"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_type: ["podcast", "ppt", "report"],
      message_role: ["user", "assistant", "system"],
      report_style: ["ACADEMIC", "POPULAR_SCIENCE", "NEWS", "SOCIAL_MEDIA"],
      research_status: ["planning", "executing", "completed", "failed"],
      user_role: ["user", "admin"],
    },
  },
} as const

// Additional convenient type exports
export type UserProfile = Tables<'user_profiles'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type Note = Tables<'notes'>
export type CalendarEvent = Tables<'calendar_events'>
export type Project = Tables<'projects'>
export type Task = Tables<'tasks'>
export type HealthData = Tables<'health_data'>
export type HealthMetrics = Tables<'health_metrics'>
export type UserSettings = Tables<'user_settings'>
export type GeneratedContent = Tables<'generated_content'>
export type ConversationSummary = Tables<'conversation_summary'>

// Insert types
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type ConversationInsert = TablesInsert<'conversations'>
export type MessageInsert = TablesInsert<'messages'>
export type NoteInsert = TablesInsert<'notes'>
export type CalendarEventInsert = TablesInsert<'calendar_events'>
export type ProjectInsert = TablesInsert<'projects'>
export type TaskInsert = TablesInsert<'tasks'>
export type HealthDataInsert = TablesInsert<'health_data'>
export type HealthMetricsInsert = TablesInsert<'health_metrics'>
export type UserSettingsInsert = TablesInsert<'user_settings'>
export type GeneratedContentInsert = TablesInsert<'generated_content'>

// Update types
export type UserProfileUpdate = TablesUpdate<'user_profiles'>
export type ConversationUpdate = TablesUpdate<'conversations'>
export type MessageUpdate = TablesUpdate<'messages'>
export type NoteUpdate = TablesUpdate<'notes'>
export type CalendarEventUpdate = TablesUpdate<'calendar_events'>
export type ProjectUpdate = TablesUpdate<'projects'>
export type TaskUpdate = TablesUpdate<'tasks'>
export type HealthDataUpdate = TablesUpdate<'health_data'>
export type HealthMetricsUpdate = TablesUpdate<'health_metrics'>
export type UserSettingsUpdate = TablesUpdate<'user_settings'>
export type GeneratedContentUpdate = TablesUpdate<'generated_content'>

// Enum types
export type UserRole = Enums<'user_role'>
export type MessageRole = Enums<'message_role'>
export type ResearchStatus = Enums<'research_status'>
export type ContentType = Enums<'content_type'>
export type ReportStyle = Enums<'report_style'>