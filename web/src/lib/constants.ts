// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

/**
 * Centralized constants for the application
 * This ensures consistency across the codebase and makes it easy to adjust timeouts
 */

// Timeout constants (in milliseconds)
export const TIMEOUTS = {
  // Authentication related timeouts
  AUTH_CHECK: 5000,           // Auth session check
  LOGIN_REQUEST: 8000,        // Login/register requests
  
  // API call timeouts
  API_CALL: 10000,           // Standard API calls
  DATABASE_QUERY: 15000,     // Database queries (Neon PostgreSQL)

  // Connection and testing
  CONNECTION_TEST: 3000,      // Quick connection tests
  HEALTH_CHECK: 5000,        // Health check endpoints
  
  // File operations
  FILE_UPLOAD: 30000,        // File upload operations
  
  // Realtime subscriptions
  REALTIME_CONNECT: 8000,    // Realtime connection timeout
  
  // Debug and development
  DEBUG_OPERATION: 5000,     // Debug operations timeout
} as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005/api',
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,       // Initial retry delay (ms)
  BACKOFF_MULTIPLIER: 2,     // Exponential backoff multiplier
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_CURSOR_LIMIT: 100,
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  USER_PROFILE: 5 * 60 * 1000,        // 5 minutes
  CONVERSATIONS: 2 * 60 * 1000,       // 2 minutes
  MESSAGES: 30 * 1000,                // 30 seconds
  HEALTH_DATA: 1 * 60 * 1000,         // 1 minute
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,        // Input debounce delay
  ANIMATION_DURATION: 200,     // Standard animation duration
  TOAST_DURATION: 5000,       // Toast notification duration
} as const;

// Security constants
export const SECURITY = {
  SESSION_REFRESH_THRESHOLD: 5 * 60 * 1000,  // Refresh session if expires in 5 minutes
  TOKEN_VALIDATION_INTERVAL: 60 * 1000,      // Check token validity every minute
} as const;

// Export all for convenience
export const CONSTANTS = {
  TIMEOUTS,
  API_ENDPOINTS,
  RETRY_CONFIG,
  PAGINATION,
  CACHE_DURATION,
  UI_CONSTANTS,
  SECURITY,
} as const;

export default CONSTANTS;