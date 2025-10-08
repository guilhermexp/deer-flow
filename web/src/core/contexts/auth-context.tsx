'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { getSupabaseClient } from '~/lib/supabase/client';
import { retry } from '~/lib/retry-utils';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Helper function to get user profile
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch failed (non-critical):', error.message);
        return null;
      }

      return profile;
    } catch (error) {
      console.warn('Profile fetch exception:', error);
      return null;
    }
  }, [supabase]);

  // Helper function to set user data
  const setUserData = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const profile = await getUserProfile(supabaseUser.id);
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        profile: profile ?? undefined,
      };
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error setting user data:', error);
      // Set basic user data without profile
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
      };
      setUser(userData);
      return userData;
    }
  }, [getUserProfile]);

  const checkAuth = useCallback(async () => {
    if (isCheckingAuth) {
      console.log('🔄 Auth check already in progress, skipping...');
      return;
    }
    
    // Complete development mode bypass - skip all Supabase calls
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Complete auth bypass - using mock user');
      setIsCheckingAuth(true);
      
      // Immediately create mock user without any Supabase calls
      const mockUser: User = {
        id: 'dev-user-localhost',
        email: 'dev@localhost.com',
      };
      
      setUser(mockUser);
      setIsLoading(false);
      setIsCheckingAuth(false);
      console.log('✅ Dev mode: Mock user created, auth complete');
      return;
    }
    
    // Production mode: full auth check with retries
    try {
      setIsCheckingAuth(true);
      console.log('🔍 Production auth check...');
      
      let lastError: Error | null = null;
      let session: { user: SupabaseUser } | null = null;
      
      // Retry logic for production using retry utility
      try {
        const { data, error } = await retry(
          async () => {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Session check timeout')), 15000)
            );

            const result = await Promise.race([
              sessionPromise,
              timeoutPromise
            ]);

            if (result.error) {
              throw result.error;
            }

            return result;
          },
          {
            retries: 3,
            minTimeout: 1000,
            factor: 2,
            onFailedAttempt: (error, attempt) => {
              console.warn(`⚠️ Auth attempt ${attempt}/3 failed:`, error.message);
            }
          }
        );

        session = data.session;
      } catch (error) {
        lastError = error as Error;
        console.error('❌ All auth attempts failed:', error);
      }
      
      if (lastError || !session?.user) {
        console.error('❌ All auth attempts failed:', lastError?.message);
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('✅ Valid session found, setting user data');
      const userData: User = {
        id: session.user.id,
        email: session.user.email ?? '',
      };
      setUser(userData);
      setIsLoading(false);
      
      // Load profile in background (non-blocking)
      getUserProfile(session.user.id).then(profile => {
        if (profile) {
          setUser(prev => prev ? { ...prev, profile } : userData);
        }
      }).catch(err => {
        console.warn('Profile load failed:', err);
      });
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
      setIsLoading(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [supabase, getUserProfile]);

  // Initialize auth check on mount
  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      void checkAuth();
    }

    // Skip Supabase listener in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Skipping Supabase auth listener');
      return () => {
        mounted = false;
      };
    }

    // Listen for auth state changes (production only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await setUserData(session.user);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await setUserData(session.user);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Development mode - instant mock login
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Development mode: Mock login successful');
      const mockUser: User = {
        id: 'dev-user-localhost',
        email: email || 'dev@localhost.com',
      };
      setUser(mockUser);
      setIsLoading(false);
      return;
    }

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
            username: username ?? email.split('@')[0] ?? null,
            full_name: username ?? email.split('@')[0] ?? null,
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
    isLoading,
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