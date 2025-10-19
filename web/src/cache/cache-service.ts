// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Cache Service Implementation with Redis/localStorage fallback

import type {
  CacheEntry,
  CacheOptions,
  CacheStats,
  CacheMetadata
} from '../performance/types';
import { CACHE_DEFAULTS } from '../performance/constants';
import { SimpleEventEmitter, formatBytes } from '../utils/performance-utils';

export interface CacheServiceConfig {
  defaultTtl: number;
  maxSize: number;
  enableRedis: boolean;
  redisUrl?: string;
  enableLocalStorage: boolean;
  enableMemoryCache: boolean;
}

export class CacheService extends SimpleEventEmitter {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private memorySize: number = 0;
  private config: CacheServiceConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };

  constructor(config: Partial<CacheServiceConfig> = {}) {
    super();
    this.config = {
      defaultTtl: CACHE_DEFAULTS.TTL,
      maxSize: CACHE_DEFAULTS.MAX_SIZE,
      enableRedis: false, // Redis not available in browser
      enableLocalStorage: typeof localStorage !== 'undefined',
      enableMemoryCache: true,
      ...config
    };

    this.startCleanupInterval();
  }

  // ==================== Public Methods ====================

  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      if (this.config.enableMemoryCache) {
        const memoryResult = this.getFromMemory<T>(key);
        if (memoryResult !== null) {
          this.stats.hits++;
          this.emit('cache:hit', { key, source: 'memory' });
          return memoryResult;
        }
      }

      // Fall back to localStorage
      if (this.config.enableLocalStorage) {
        const localStorageResult = await this.getFromLocalStorage<T>(key);
        if (localStorageResult !== null) {
          // Store in memory for faster access
          if (this.config.enableMemoryCache) {
            await this.setInMemory(key, localStorageResult, {
              ttl: this.config.defaultTtl
            });
          }
          this.stats.hits++;
          this.emit('cache:hit', { key, source: 'localStorage' });
          return localStorageResult;
        }
      }

      this.stats.misses++;
      this.emit('cache:miss', { key });
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl ?? this.config.defaultTtl;
      const tags = options.tags ?? [];

      // Store in memory cache
      if (this.config.enableMemoryCache) {
        await this.setInMemory(key, value, { ttl, tags, ...options });
      }

      // Store in localStorage only when explicitly marked persistent
      if (this.config.enableLocalStorage && options.persistent === true) {
        await this.setInLocalStorage(key, value, { ttl, tags, ...options });
      }

      this.stats.sets++;
      this.emit('cache:set', { key, size: this.calculateSize(value) });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from memory
      if (this.config.enableMemoryCache && this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key)!;
        this.memorySize -= entry.metadata.size;
        this.memoryCache.delete(key);
        deleted = true;
      }

      // Delete from localStorage
      if (this.config.enableLocalStorage) {
        const localKey = this.getLocalStorageKey(key);
        if (localStorage.getItem(localKey)) {
          localStorage.removeItem(localKey);
          deleted = true;
        }
      }

      if (deleted) {
        this.stats.deletes++;
        this.emit('cache:delete', { key });
      }

      return deleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear memory cache
      if (this.config.enableMemoryCache) {
        this.memoryCache.clear();
        this.memorySize = 0;
      }

      // Clear localStorage cache (only our keys)
      if (this.config.enableLocalStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('deer_cache:')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      this.emit('cache:clear', {});
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async invalidate(tags: string[]): Promise<void> {
    try {
      const keysToDelete: string[] = [];

      // Find keys with matching tags in memory
      if (this.config.enableMemoryCache) {
        for (const [key, entry] of this.memoryCache.entries()) {
          if (tags.some(tag => entry.metadata.tags.includes(tag))) {
            keysToDelete.push(key);
          }
        }
      }

      // Delete found keys
      for (const key of keysToDelete) {
        await this.delete(key);
      }

      this.emit('cache:invalidate', { tags, keysInvalidated: keysToDelete.length });
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  getStats(): CacheStats {
    const now = Date.now();
    let oldestEntry = now;
    let newestEntry = 0;

    for (const entry of this.memoryCache.values()) {
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      totalKeys: this.memoryCache.size,
      hitRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.memorySize,
      oldestEntry: oldestEntry === now ? 0 : oldestEntry,
      newestEntry
    };
  }

  // ==================== Private Methods ====================

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.memorySize -= entry.metadata.size;
      return null;
    }

    // Update access statistics
    entry.metadata.hitCount++;
    entry.metadata.lastAccessed = now;

    return entry.data as T;
  }

  private async setInMemory<T>(
    key: string,
    value: T,
    options: CacheOptions
  ): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl ?? this.config.defaultTtl;
    const size = this.calculateSize(value);

    // Check if we need to evict entries
    await this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + ttl,
      key,
      metadata: {
        source: 'computed',
        hitCount: 0,
        lastAccessed: now,
        size,
        tags: options.tags ?? []
      }
    };

    // Remove old entry if exists
    if (this.memoryCache.has(key)) {
      const oldEntry = this.memoryCache.get(key)!;
      this.memorySize -= oldEntry.metadata.size;
    }

    this.memoryCache.set(key, entry);
    this.memorySize += size;
  }

  private async getFromLocalStorage<T>(key: string): Promise<T | null> {
    try {
      const localKey = this.getLocalStorageKey(key);
      const item = localStorage.getItem(localKey);

      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (now > entry.expiresAt) {
        localStorage.removeItem(localKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('localStorage get error:', error);
      return null;
    }
  }

  private async setInLocalStorage<T>(
    key: string,
    value: T,
    options: CacheOptions
  ): Promise<void> {
    try {
      const now = Date.now();
      const ttl = options.ttl ?? this.config.defaultTtl;

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        expiresAt: now + ttl,
        key,
        metadata: {
          source: 'api',
          hitCount: 0,
          lastAccessed: now,
          size: this.calculateSize(value),
          tags: options.tags ?? []
        }
      };

      const localKey = this.getLocalStorageKey(key);
      localStorage.setItem(localKey, JSON.stringify(entry));
    } catch (error) {
      // localStorage might be full or unavailable
      console.warn('localStorage set failed:', error);
    }
  }

  private getLocalStorageKey(key: string): string {
    return `deer_cache:${key}`;
  }

  private calculateSize(value: any): number {
    try {
      if (typeof value === 'string') {
        // Approximate string size as character length (bytes)
        return value.length;
      }
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      // Fallback for non-JSON values
      return String(value).length * 2; // Rough estimate
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const maxSize = this.config.maxSize;

    while (this.memorySize + requiredSize > maxSize && this.memoryCache.size > 0) {
      // Find least recently used entry
      let lruKey: string | null = null;
      let lruTime = Number.POSITIVE_INFINITY;

      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.metadata.lastAccessed < lruTime) {
          lruTime = entry.metadata.lastAccessed;
          lruKey = key;
        }
      }

      if (lruKey) {
        const entry = this.memoryCache.get(lruKey)!;
        this.memoryCache.delete(lruKey);
        this.memorySize -= entry.metadata.size;
        this.stats.evictions++;
        this.emit('cache:evict', { key: lruKey, reason: 'lru' });
      } else {
        break;
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CACHE_DEFAULTS.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries in memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      const entry = this.memoryCache.get(key)!;
      this.memoryCache.delete(key);
      this.memorySize -= entry.metadata.size;
    }

    if (expiredKeys.length > 0) {
      this.emit('cache:cleanup', { expiredKeys: expiredKeys.length });
    }

    // Clean up localStorage expired entries (sample only to avoid performance issues)
    if (this.config.enableLocalStorage && Math.random() < 0.1) {
      this.cleanupLocalStorage();
    }
  }

  private cleanupLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('deer_cache:')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              if (now > entry.expiresAt) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid entry, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors during cleanup
        }
      });
    } catch (error) {
      console.warn('localStorage cleanup failed:', error);
    }
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
    this.memorySize = 0;
    this.removeAllListeners();
  }
}

// Default instance
export const cacheService = new CacheService();
