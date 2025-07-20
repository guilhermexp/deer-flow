// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

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
  const router = useRouter();
  const supabase = getSupabaseClient();

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Auth: Checking authentication...');
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('⚠️ Auth: Timeout reached, setting loading to false');
        setIsLoading(false);
      }, 10000); // 10 seconds timeout

      // First check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      clearTimeout(timeout);
      
      if (sessionError || !session) {
        // No session, user is not authenticated
        console.log('❌ Auth: No valid session found');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // We have a session, get the user
      console.log('✅ Auth: Valid session found, getting user...');
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth: Failed to get user:', error);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (supabaseUser) {
        console.log('✅ Auth: User found, getting profile...');
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (profileError) {
          console.log('⚠️ Auth: Profile error (non-critical):', profileError);
        }

        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          profile: (!profileError && profile) ? profile : undefined,
        };
        
        console.log('✅ Auth: Authentication successful', userData);
        setUser(userData);
      } else {
        console.log('❌ Auth: No user found in session');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth: Exception during auth check:', error);
      setUser(null);
    } finally {
      console.log('🏁 Auth: Setting loading to false');
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    
    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            profile: (!profileError && profile) ? profile : undefined,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to run only once

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // The onAuthStateChange listener will handle setting the user
      router.push('/chat');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Create user profile if user was created
      if (data.user) {
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
          console.error('Failed to create user profile:', profileError);
        }
      }

      // The onAuthStateChange listener will handle setting the user
      router.push('/chat');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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