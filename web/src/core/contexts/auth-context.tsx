'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
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
  
  // Clerk hooks
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();

  // Helper function to convert Clerk user to our User format
  const setClerkUserData = useCallback((clerkUser: any) => {
    if (!clerkUser) return null;
    
    const userData: User = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      fullName: clerkUser.fullName || undefined,
      imageUrl: clerkUser.imageUrl || undefined,
    };
    
    setUser(userData);
    return userData;
  }, []);

  const checkAuth = useCallback(async () => {
    if (!clerkLoaded) {
      return;
    }

    try {
      if (clerkUser) {
        setClerkUserData(clerkUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, clerkLoaded, setClerkUserData]);

  // Initialize auth check on mount
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Redirect to Clerk's sign-in page
      router.push('/sign-in');
      
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
      
      // Redirect to Clerk's sign-up page
      router.push('/sign-up');
      
    } catch (error) {
      console.error('❌ Auth: Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
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
    isLoading: isLoading || !clerkLoaded,
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
