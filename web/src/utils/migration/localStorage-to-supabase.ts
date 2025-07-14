// Local Storage to Supabase Migration Utilities
// This file contains functions to migrate data from localStorage to Supabase

import { getSupabaseClient } from '~/lib/supabase/client'
import type { 
  TablesInsert, 
  KanbanColumn,
  HealthMetricValue 
} from '~/types/supabase'

// Migration status tracking
interface MigrationStatus {
  conversations: boolean
  notes: boolean
  calendar: boolean
  projects: boolean
  health: boolean
  settings: boolean
}

// Main migration function
export async function migrateAllUserData(userId: string): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    conversations: false,
    notes: false,
    calendar: false,
    projects: false,
    health: false,
    settings: false,
  }

  try {
    // Migrate each data type
    status.conversations = await migrateConversations(userId)
    status.notes = await migrateNotes(userId)
    status.calendar = await migrateCalendarEvents(userId)
    status.projects = await migrateProjects(userId)
    status.health = await migrateHealthData(userId)
    status.settings = await migrateSettings(userId)

    // Mark migration as complete
    localStorage.setItem('deepflow.migration.completed', new Date().toISOString())
    localStorage.setItem('deepflow.migration.status', JSON.stringify(status))

    return status
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Migrate conversation history
async function migrateConversations(userId: string): Promise<boolean> {
  try {
    const historyData = localStorage.getItem('deerflow.history')
    if (!historyData) return true

    const history = JSON.parse(historyData)
    if (!Array.isArray(history) || history.length === 0) return true

    const supabase = getSupabaseClient()
    
    // Prepare conversation data
    const conversations: TablesInsert<'conversations'>[] = history.map(item => ({
      user_id: userId,
      thread_id: item.threadId || `legacy-${Date.now()}-${Math.random()}`,
      title: item.title || 'Untitled Conversation',
      query: item.query || '',
      created_at: item.timestamp || new Date().toISOString(),
      is_archived: false,
      metadata: {
        migrated: true,
        originalData: item,
      },
    }))

    // Batch insert conversations
    const { error } = await supabase
      .from('conversations')
      .insert(conversations)

    if (error) {
      console.error('Failed to migrate conversations:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error migrating conversations:', error)
    return false
  }
}

// Migrate notes
async function migrateNotes(userId: string): Promise<boolean> {
  try {
    const notesData = localStorage.getItem('jarvis-notes')
    if (!notesData) return true

    const notes = JSON.parse(notesData)
    if (!Array.isArray(notes) || notes.length === 0) return true

    const supabase = getSupabaseClient()
    
    // Prepare notes data
    const notesInsert: TablesInsert<'notes'>[] = notes.map(note => ({
      user_id: userId,
      title: note.title || 'Untitled Note',
      media_type: note.mediaType,
      media_source: note.mediaSource,
      media_url: note.mediaUrl,
      content: note.content,
      transcript: note.transcript,
      summary: note.summary,
      ai_processed: note.aiProcessed || false,
      created_at: note.createdAt || new Date().toISOString(),
      metadata: {
        migrated: true,
        originalId: note.id,
        sessions: note.sessions || [],
      },
    }))

    // Batch insert notes
    const { data: insertedNotes, error } = await supabase
      .from('notes')
      .insert(notesInsert)
      .select()

    if (error) {
      console.error('Failed to migrate notes:', error)
      return false
    }

    // Migrate note sessions if they exist
    if (insertedNotes) {
      for (let i = 0; i < insertedNotes.length; i++) {
        const note = insertedNotes[i]
        const originalNote = notes[i]
        
        if (originalNote.sessions && Array.isArray(originalNote.sessions)) {
          for (const session of originalNote.sessions) {
            // Insert session
            const { data: noteSession, error: sessionError } = await supabase
              .from('note_sessions')
              .insert({
                note_id: note.id,
                session_name: session.sessionName || 'Default Session',
                created_at: session.createdAt || new Date().toISOString(),
              })
              .select()
              .single()

            if (sessionError) {
              console.error('Failed to migrate note session:', sessionError)
              continue
            }

            // Insert session messages
            if (session.messages && Array.isArray(session.messages)) {
              const messages: TablesInsert<'note_messages'>[] = session.messages.map((msg: any) => ({
                session_id: noteSession.id,
                role: msg.role || 'user',
                content: msg.content || '',
                created_at: msg.timestamp || new Date().toISOString(),
              }))

              const { error: messagesError } = await supabase
                .from('note_messages')
                .insert(messages)

              if (messagesError) {
                console.error('Failed to migrate note messages:', messagesError)
              }
            }
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error migrating notes:', error)
    return false
  }
}

// Migrate calendar events
async function migrateCalendarEvents(userId: string): Promise<boolean> {
  try {
    const eventsData = localStorage.getItem('jarvis-calendar-events')
    if (!eventsData) return true

    const events = JSON.parse(eventsData)
    if (!Array.isArray(events) || events.length === 0) return true

    const supabase = getSupabaseClient()
    
    // Prepare events data
    const eventsInsert: TablesInsert<'calendar_events'>[] = events.map(event => ({
      user_id: userId,
      title: event.title || 'Untitled Event',
      description: event.description,
      start_time: event.start || event.date || new Date().toISOString(),
      end_time: event.end || event.date || new Date().toISOString(),
      all_day: event.allDay || false,
      color: event.color,
      created_at: event.createdAt || new Date().toISOString(),
    }))

    // Batch insert events
    const { error } = await supabase
      .from('calendar_events')
      .insert(eventsInsert)

    if (error) {
      console.error('Failed to migrate calendar events:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error migrating calendar events:', error)
    return false
  }
}

// Migrate projects and tasks
async function migrateProjects(userId: string): Promise<boolean> {
  try {
    const projectsData = localStorage.getItem('kanban-projects-v2')
    const tasksData = localStorage.getItem('kanban-tasksByProject-v2')
    
    if (!projectsData) return true

    const projects = JSON.parse(projectsData)
    const tasksByProject = tasksData ? JSON.parse(tasksData) : {}

    if (!Array.isArray(projects) || projects.length === 0) return true

    const supabase = getSupabaseClient()
    
    // Migrate each project and its tasks
    for (const project of projects) {
      // Insert project
      const { data: insertedProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: project.name || 'Untitled Project',
          description: project.description,
          columns: project.columns || [],
          created_at: project.createdAt || new Date().toISOString(),
        })
        .select()
        .single()

      if (projectError) {
        console.error('Failed to migrate project:', projectError)
        continue
      }

      // Migrate tasks for this project
      const projectTasks = tasksByProject[project.id] || []
      if (projectTasks.length > 0) {
        const tasksInsert: TablesInsert<'tasks'>[] = projectTasks.map((task: any, index: number) => ({
          project_id: insertedProject.id,
          title: task.title || 'Untitled Task',
          description: task.description,
          column_id: task.columnId || project.columns[0]?.id || 'default',
          position: task.position ?? index,
          priority: task.priority || 'medium',
          due_date: task.dueDate,
          completed: task.completed || false,
          created_at: task.createdAt || new Date().toISOString(),
        }))

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksInsert)

        if (tasksError) {
          console.error('Failed to migrate tasks:', tasksError)
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error migrating projects:', error)
    return false
  }
}

// Migrate health data
async function migrateHealthData(userId: string): Promise<boolean> {
  try {
    const healthData = localStorage.getItem('jarvis-health-data')
    if (!healthData) return true

    const data = JSON.parse(healthData)
    if (!data || typeof data !== 'object') return true

    const supabase = getSupabaseClient()
    
    // Prepare health metrics
    const metrics: TablesInsert<'health_metrics'>[] = []

    // Convert each metric type
    const metricTypes = ['sleep', 'water', 'steps', 'bloodPressure', 'weight', 'heartRate']
    
    for (const metricType of metricTypes) {
      if (data[metricType]) {
        // Handle array data (e.g., sleep records)
        if (Array.isArray(data[metricType])) {
          for (const record of data[metricType]) {
            metrics.push({
              user_id: userId,
              metric_type: metricType,
              value: record as HealthMetricValue,
              recorded_at: record.date || new Date().toISOString(),
              created_at: new Date().toISOString(),
            })
          }
        } else {
          // Handle single value data
          metrics.push({
            user_id: userId,
            metric_type: metricType,
            value: data[metricType] as HealthMetricValue,
            recorded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    if (metrics.length > 0) {
      const { error } = await supabase
        .from('health_metrics')
        .insert(metrics)

      if (error) {
        console.error('Failed to migrate health data:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error migrating health data:', error)
    return false
  }
}

// Migrate user settings
async function migrateSettings(userId: string): Promise<boolean> {
  try {
    const settingsData = localStorage.getItem('deerflow.settings')
    if (!settingsData) return true

    const settings = JSON.parse(settingsData)
    const supabase = getSupabaseClient()
    
    // Prepare settings data
    const settingsInsert: TablesInsert<'user_settings'> = {
      user_id: userId,
      general_settings: settings.generalSettings || {},
      mcp_servers: settings.mcpServers || [],
      report_style: settings.reportStyle || 'ACADEMIC',
      enable_deep_thinking: settings.enableDeepThinking || false,
      enable_background_investigation: settings.enableBackgroundInvestigation || false,
      max_search_results: settings.maxSearchResults || 5,
      max_plan_iterations: settings.maxPlanIterations || 3,
      max_step_num: settings.maxStepNum || 20,
    }

    // Upsert settings
    const { error } = await supabase
      .from('user_settings')
      .upsert(settingsInsert, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to migrate settings:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error migrating settings:', error)
    return false
  }
}

// Check if migration has been completed
export function isMigrationCompleted(): boolean {
  return localStorage.getItem('deepflow.migration.completed') !== null
}

// Get migration status
export function getMigrationStatus(): MigrationStatus | null {
  const status = localStorage.getItem('deepflow.migration.status')
  return status ? JSON.parse(status) : null
}

// Clear localStorage after successful migration (optional)
export function clearLocalStorageData(keepAuthData = true): void {
  const keysToKeep = keepAuthData 
    ? ['deepflow.migration.completed', 'deepflow.migration.status'] 
    : []

  const keysToRemove = [
    'deerflow.history',
    'deerflow.settings',
    'jarvis-notes',
    'jarvis-calendar-events',
    'kanban-projects-v2',
    'kanban-tasksByProject-v2',
    'jarvis-health-data',
  ]

  for (const key of keysToRemove) {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}