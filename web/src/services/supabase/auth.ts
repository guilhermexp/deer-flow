// Authentication Service for Deep-flow

import { getSupabaseClient } from '~/lib/supabase/client'
import type { UserProfile } from '~/types/supabase'

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: { full_name?: string }) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error
    return data
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign in with OAuth provider
  async signInWithProvider(provider: 'google' | 'github') {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const supabase = getSupabaseClient()
    
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('No active session')
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    return user
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    return data
  },

  // Create or update user profile
  async upsertUserProfile(profile: Partial<UserProfile> & { id: string }) {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = getSupabaseClient()
    
    return supabase.auth.onAuthStateChange(callback)
  },
}