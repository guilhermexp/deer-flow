// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Authentication Manager Implementation

import type {
  AuthToken,
  AuthRequest,
  AuthErrorResult,
  ApiError
} from '../performance/types';
import { AUTH_DEFAULTS } from '../performance/constants';
import { SimpleEventEmitter, classifyError } from '../utils/performance-utils';
import { CacheService } from '../cache/cache-service';

export interface AuthManagerConfig {
  cacheService: CacheService;
  refreshTokenUrl: string;
  loginUrl: string;
  tokenRefreshBuffer: number;
  maxRetryAttempts: number;
  queueTimeout: number;
  enableTokenRefresh: boolean;
  enableRequestQueue: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class AuthManager extends SimpleEventEmitter {
  private config: AuthManagerConfig;
  private currentToken: AuthToken | null = null;
  private refreshPromise: Promise<AuthToken> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private isRefreshing: boolean = false;

  constructor(config: Partial<AuthManagerConfig> & {
    refreshTokenUrl: string;
    loginUrl: string;
    cacheService: CacheService;
  }) {
    super();

    this.config = {
      tokenRefreshBuffer: AUTH_DEFAULTS.TOKEN_REFRESH_BUFFER,
      maxRetryAttempts: AUTH_DEFAULTS.MAX_RETRY_ATTEMPTS,
      queueTimeout: AUTH_DEFAULTS.QUEUE_TIMEOUT,
      enableTokenRefresh: true,
      enableRequestQueue: true,
      ...config
    };

    this.initializeFromCache();
  }

  // ==================== Public Methods ====================

  async getCurrentToken(): Promise<string | null> {
    try {
      // Check if we have a valid token
      if (this.currentToken && this.isTokenValid(this.currentToken)) {
        return this.currentToken.accessToken;
      }

      // Check if token needs refresh
      if (this.currentToken && this.shouldRefreshToken(this.currentToken)) {
        return this.getOrRefreshToken();
      }

      // No valid token available
      return null;
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    if (!this.config.enableTokenRefresh) {
      return false;
    }

    try {
      const newToken = await this.performTokenRefresh();
      this.setToken(newToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleTokenRefreshFailure(error as ApiError);
      return false;
    }
  }

  invalidateToken(): void {
    this.currentToken = null;
    this.clearTokenFromCache();
    this.emit('auth:token_invalidated', {});
  }

  async addAuthHeaders(request: AuthRequest): Promise<AuthRequest> {
    const token = await this.getCurrentToken();

    if (token) {
      return {
        ...request,
        headers: {
          ...request.headers,
          'Authorization': `Bearer ${token}`
        }
      };
    }

    return request;
  }

  async handleAuthError(error: ApiError): Promise<AuthErrorResult> {
    const category = classifyError(error);

    // Handle 401 Unauthorized
    if (error.statusCode === 401) {
      return this.handleUnauthorizedError(error);
    }

    // Handle 403 Forbidden
    if (error.statusCode === 403) {
      return this.handleForbiddenError(error);
    }

    // Handle other auth-related errors
    if (category === 'authentication') {
      return this.handleGenericAuthError(error);
    }

    return {
      canRetry: false,
      shouldRefreshToken: false,
      shouldRedirectToLogin: false,
      error
    };
  }

  async retryWithNewAuth<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: ApiError;
    let attempts = 0;

    while (attempts < this.config.maxRetryAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as ApiError;
        attempts++;

        // Check if this is an auth error that we can handle
        const authResult = await this.handleAuthError(lastError);

        if (!authResult.canRetry) {
          break;
        }

        if (authResult.shouldRefreshToken) {
          const refreshSuccess = await this.refreshToken();
          if (!refreshSuccess) {
            break;
          }
        }

        if (authResult.shouldRedirectToLogin) {
          this.redirectToLogin();
          break;
        }

        // Wait before retry
        await this.delay(1000 * attempts);
      }
    }

    throw lastError!;
  }

  // ==================== Token Management ====================

  setToken(token: AuthToken): void {
    this.currentToken = token;
    this.cacheToken(token);
    this.emit('auth:token_updated', token);

    // Process any queued requests
    this.processRequestQueue();
  }

  private async getOrRefreshToken(): Promise<string> {
    if (!this.config.enableRequestQueue) {
      return this.performTokenRefresh().then(token => {
        this.setToken(token);
        return token.accessToken;
      });
    }

    // If we're already refreshing, queue this request
    if (this.isRefreshing) {
      return this.queueTokenRequest();
    }

    // Start refresh process
    this.isRefreshing = true;

    try {
      if (!this.refreshPromise) {
        this.refreshPromise = this.performTokenRefresh();
      }

      const newToken = await this.refreshPromise;
      this.setToken(newToken);
      return newToken.accessToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async queueTokenRequest(): Promise<string> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.indexOf(queuedRequest);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Token request timeout'));
        }
      }, this.config.queueTimeout);
    });
  }

  private processRequestQueue(): void {
    if (!this.currentToken || this.requestQueue.length === 0) {
      return;
    }

    const token = this.currentToken.accessToken;
    const queue = [...this.requestQueue];
    this.requestQueue.length = 0;

    for (const request of queue) {
      try {
        request.resolve(token);
      } catch (error) {
        request.reject(error as Error);
      }
    }
  }

  // ==================== Token Validation ====================

  private isTokenValid(token: AuthToken): boolean {
    if (!token.accessToken) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);

    // Check if token is expired
    if (now >= expiresAt) {
      return false;
    }

    return true;
  }

  private shouldRefreshToken(token: AuthToken): boolean {
    if (!this.config.enableTokenRefresh) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const refreshTime = new Date(expiresAt.getTime() - this.config.tokenRefreshBuffer);

    return now >= refreshTime;
  }

  // ==================== Token Refresh Implementation ====================

  private async performTokenRefresh(): Promise<AuthToken> {
    if (!this.currentToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // This would typically call your auth service
      // For now, we'll simulate the refresh process
      const response = await this.callRefreshEndpoint(this.currentToken.refreshToken);

      const newToken: AuthToken = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || this.currentToken.refreshToken,
        expiresAt: new Date(Date.now() + (response.expires_in * 1000)),
        tokenType: response.token_type || 'Bearer',
        scope: response.scope ? response.scope.split(' ') : this.currentToken.scope
      };

      this.emit('auth:token_refresh_success', newToken);
      return newToken;
    } catch (error) {
      this.emit('auth:token_refresh_failed', error);
      throw error;
    }
  }

  private async callRefreshEndpoint(refreshToken: string): Promise<any> {
    // This is a placeholder - in reality you'd use your HTTP client
    // For the demo, we'll throw an error to simulate failure
    const response = await fetch(this.config.refreshTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    return response.json();
  }

  // ==================== Error Handling ====================

  private async handleUnauthorizedError(error: ApiError): Promise<AuthErrorResult> {
    // 401 usually means token is invalid or expired
    if (this.currentToken && this.config.enableTokenRefresh) {
      return {
        canRetry: true,
        shouldRefreshToken: true,
        shouldRedirectToLogin: false
      };
    }

    return {
      canRetry: false,
      shouldRefreshToken: false,
      shouldRedirectToLogin: true,
      error
    };
  }

  private async handleForbiddenError(error: ApiError): Promise<AuthErrorResult> {
    // 403 usually means insufficient permissions
    return {
      canRetry: false,
      shouldRefreshToken: false,
      shouldRedirectToLogin: false,
      error
    };
  }

  private async handleGenericAuthError(error: ApiError): Promise<AuthErrorResult> {
    return {
      canRetry: true,
      shouldRefreshToken: true,
      shouldRedirectToLogin: false,
      error
    };
  }

  private handleTokenRefreshFailure(error: ApiError): void {
    // Clear invalid token
    this.invalidateToken();

    // Reject all queued requests
    const queue = [...this.requestQueue];
    this.requestQueue.length = 0;

    for (const request of queue) {
      request.reject(new Error('Token refresh failed'));
    }

    this.emit('auth:refresh_failed', error);
  }

  // ==================== Cache Management ====================

  private async initializeFromCache(): Promise<void> {
    try {
      const cachedToken = await this.config.cacheService.get<AuthToken>('auth_token');
      if (cachedToken && this.isTokenValid(cachedToken)) {
        this.currentToken = cachedToken;
        this.emit('auth:token_restored', cachedToken);
      }
    } catch (error) {
      console.warn('Failed to restore token from cache:', error);
    }
  }

  private async cacheToken(token: AuthToken): Promise<void> {
    try {
      const ttl = token.expiresAt.getTime() - Date.now();
      await this.config.cacheService.set('auth_token', token, {
        ttl: Math.max(ttl, 0),
        persistent: true,
        tags: ['auth']
      });
    } catch (error) {
      console.warn('Failed to cache token:', error);
    }
  }

  private async clearTokenFromCache(): Promise<void> {
    try {
      await this.config.cacheService.delete('auth_token');
    } catch (error) {
      console.warn('Failed to clear token from cache:', error);
    }
  }

  // ==================== Utility Methods ====================

  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = this.config.loginUrl;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    // Clear any pending refresh
    this.refreshPromise = null;
    this.isRefreshing = false;

    // Reject all queued requests
    const queue = [...this.requestQueue];
    this.requestQueue.length = 0;

    for (const request of queue) {
      request.reject(new Error('AuthManager destroyed'));
    }

    this.removeAllListeners();
  }
}