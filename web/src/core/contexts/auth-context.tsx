'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '~/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '~/types/supabase';

interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Helper function to get user profile
  const getUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Profile fetch error (non-critical)
        return null;
      }

      return profile;
    } catch (error) {
      // Keep console.error for critical errors
      console.error('❌ Auth: Exception fetching profile:', error);
      return null;
    }
  };

  // Helper function to set user data
  const setUserData = async (supabaseUser: SupabaseUser) => {
    const profile = await getUserProfile(supabaseUser.id);
    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      profile: profile || undefined,
    };
    setUser(userData);
    return userData;
  };

  const checkAuth = useCallback(async () => {
    if (!mounted) return;

    try {
      // Checking authentication
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Auth: Session error:', sessionError.message);
        setUser(null);
        return;
      }
      
      if (!session || !session.user) {
        // No active session
        setUser(null);
        return;
      }

      // Valid session found
      await setUserData(session.user);
      // User data loaded
    } catch (error) {
      console.error('❌ Auth: Exception during auth check:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [mounted, supabase]);

  // Setup effect - runs once after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth check effect - runs after mounted
  useEffect(() => {
    if (!mounted) return;

    // Check auth immediately
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed: event
        
        if (event === 'SIGNED_IN' && session?.user) {
          await setUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data on token refresh
          await setUserData(session.user);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, checkAuth, supabase]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Attempting login
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth: Login error:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }

      // Login successful
      // The onAuthStateChange listener will handle setting the user
      // But we can also set it immediately for better UX
      await setUserData(data.user);
    } catch (error) {
      console.error('❌ Auth: Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      // Attempting registration
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth: Registration error:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('Registration failed - no user returned');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user.id,
            username: username || email.split('@')[0] || null,
            full_name: username || email.split('@')[0] || null,
            avatar_url: null,
            role: null,
          }
        ]);

      if (profileError) {
        console.error('⚠️ Auth: Profile creation error:', profileError.message);
        // Don't throw here - user is created, profile is optional
      }

      // Registration successful
      // Set user data immediately
      await setUserData(data.user);
    } catch (error) {
      console.error('❌ Auth: Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Logging out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Auth: Logout error:', error.message);
        throw error;
      }
      
      setUser(null);
      // Logout successful
      router.push('/login');
    } catch (error) {
      console.error('❌ Auth: Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !mounted, // Loading until mounted
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}