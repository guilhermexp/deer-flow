/**
 * Test utilities and wrappers for components that need providers
 */

import { render, type RenderOptions } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { AuthProvider } from '~/core/contexts/auth-context';

// Mock Supabase client for tests
const mockSupabaseClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => { /* empty */ } } }
    }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => Promise.resolve({ error: null })
  })
};

// Mock useAuth hook to return a user
vi.mock('~/core/contexts/auth-context', async () => {
  const actual = await vi.importActual('~/core/contexts/auth-context');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })
  };
});

// Mock user for tests
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  profile: {
    id: 'test-user-id',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
    role: null
  }
};

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export mock client for specific test needs
export { mockSupabaseClient };