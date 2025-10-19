// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Cache Service Unit Tests

import { CacheService } from '../../cache/cache-service';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    cacheService = new CacheService({
      defaultTtl: 5000, // 5 seconds for testing
      maxSize: 1024 * 1024, // 1MB for testing
      enableLocalStorage: true,
      enableMemoryCache: true
    });
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('Memory Cache', () => {
    it('should store and retrieve values from memory cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire entries', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      await cacheService.set(key, value, { ttl: 100 }); // 100ms TTL

      // Should be available immediately
      let result = await cacheService.get(key);
      expect(result).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should delete entries', async () => {
      const key = 'delete-test';
      const value = 'delete-value';

      await cacheService.set(key, value);
      expect(await cacheService.get(key)).toBe(value);

      const deleted = await cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should clear all entries', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe('value2');

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate entries by tags', async () => {
      await cacheService.set('user:1', { name: 'User 1' }, { tags: ['user', 'profile'] });
      await cacheService.set('user:2', { name: 'User 2' }, { tags: ['user', 'profile'] });
      await cacheService.set('settings', { theme: 'dark' }, { tags: ['settings'] });

      // All should be present
      expect(await cacheService.get('user:1')).toEqual({ name: 'User 1' });
      expect(await cacheService.get('user:2')).toEqual({ name: 'User 2' });
      expect(await cacheService.get('settings')).toEqual({ theme: 'dark' });

      // Invalidate user entries
      await cacheService.invalidate(['user']);

      // User entries should be gone, settings should remain
      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();
      expect(await cacheService.get('settings')).toEqual({ theme: 'dark' });
    });
  });

  describe('Stats', () => {
    it('should track cache statistics', async () => {
      // Miss
      await cacheService.get('non-existent');

      // Hit
      await cacheService.set('test', 'value');
      await cacheService.get('test');

      const stats = cacheService.getStats();

      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(50); // 1 hit out of 2 total requests
      expect(stats.totalKeys).toBe(1);
    });
  });

  describe('LocalStorage Integration', () => {
    it('should fall back to localStorage when memory cache misses', async () => {
      const key = 'localStorage-test';
      const value = { data: 'localStorage-value' };

      // Mock localStorage to return our value
      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
        key,
        metadata: {
          source: 'api',
          hitCount: 0,
          lastAccessed: Date.now(),
          size: 100,
          tags: []
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheEntry));

      // Create fresh cache service to ensure memory is empty
      const freshCache = new CacheService({
        enableLocalStorage: true,
        enableMemoryCache: true
      });

      const result = await freshCache.get(key);
      expect(result).toEqual(value);

      freshCache.destroy();
    });

    it('should store persistent entries in localStorage', async () => {
      const key = 'persistent-test';
      const value = { data: 'persistent-value' };

      await cacheService.set(key, value, { persistent: true });

      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `deer_cache:${key}`,
        expect.stringContaining('"data":{"data":"persistent-value"}')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });

      // Should not throw error
      await expect(cacheService.set('test', 'value', { persistent: true }))
        .resolves.not.toThrow();
    });

    it('should handle malformed localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await cacheService.get('test');
      expect(result).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should evict least recently used entries when memory limit is reached', async () => {
      // Create cache with very small memory limit
      const smallCache = new CacheService({
        maxSize: 100, // Very small limit
        enableMemoryCache: true
      });

      // Add entries that will exceed the limit
      await smallCache.set('key1', 'a'.repeat(50)); // ~50 bytes
      await smallCache.set('key2', 'b'.repeat(50)); // ~50 bytes
      await smallCache.set('key3', 'c'.repeat(50)); // Should evict key1

      // First key should be evicted
      expect(await smallCache.get('key1')).toBeNull();
      expect(await smallCache.get('key2')).toBeTruthy();
      expect(await smallCache.get('key3')).toBeTruthy();

      smallCache.destroy();
    });
  });

  describe('Events', () => {
    it('should emit cache events', async () => {
      const hitSpy = jest.fn();
      const missSpy = jest.fn();
      const setSpy = jest.fn();

      cacheService.on('cache:hit', hitSpy);
      cacheService.on('cache:miss', missSpy);
      cacheService.on('cache:set', setSpy);

      // Miss event
      await cacheService.get('non-existent');
      expect(missSpy).toHaveBeenCalledWith({ key: 'non-existent' });

      // Set event
      await cacheService.set('test', 'value');
      expect(setSpy).toHaveBeenCalledWith({ key: 'test', size: expect.any(Number) });

      // Hit event
      await cacheService.get('test');
      expect(hitSpy).toHaveBeenCalledWith({ key: 'test', source: 'memory' });
    });
  });
});
