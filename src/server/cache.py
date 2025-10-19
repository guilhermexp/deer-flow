# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import hashlib
import json
import logging
import os
from functools import wraps
from typing import Any, Callable

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache wrapper for the application"""

    def __init__(self):
        """Initialize Redis connection"""
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.default_ttl = int(os.getenv("CACHE_DEFAULT_TTL", "3600"))  # 1 hour default
        self.redis_client: redis.Redis | None = None
        self.enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"

    async def connect(self):
        """Connect to Redis"""
        if not self.enabled:
            logger.info("Cache is disabled")
            return

        try:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50
            )
            await self.redis_client.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Cache will be disabled.")
            self.enabled = False
            self.redis_client = None

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis cache disconnected")

    def _make_key(self, prefix: str, key: str) -> str:
        """Create a cache key with prefix"""
        return f"deerflow:{prefix}:{key}"

    async def get(self, prefix: str, key: str) -> Any | None:
        """Get value from cache"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            cache_key = self._make_key(prefix, key)
            value = await self.redis_client.get(cache_key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.debug(f"Cache get error: {e}")
            return None

    async def set(
        self,
        prefix: str,
        key: str,
        value: Any,
        ttl: int | None = None
    ) -> bool:
        """Set value in cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            cache_key = self._make_key(prefix, key)
            ttl = ttl or self.default_ttl
            await self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(value)
            )
            return True
        except Exception as e:
            logger.debug(f"Cache set error: {e}")
            return False

    async def delete(self, prefix: str, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            cache_key = self._make_key(prefix, key)
            await self.redis_client.delete(cache_key)
            return True
        except Exception as e:
            logger.debug(f"Cache delete error: {e}")
            return False

    async def clear_prefix(self, prefix: str) -> int:
        """Clear all keys with a given prefix"""
        if not self.enabled or not self.redis_client:
            return 0

        try:
            pattern = self._make_key(prefix, "*")
            keys = []
            async for key in self.redis_client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.debug(f"Cache clear error: {e}")
            return 0

    async def exists(self, prefix: str, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            cache_key = self._make_key(prefix, key)
            return await self.redis_client.exists(cache_key) > 0
        except Exception as e:
            logger.debug(f"Cache exists error: {e}")
            return False

    async def increment(self, prefix: str, key: str, amount: int = 1) -> int | None:
        """Increment a counter in cache"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            cache_key = self._make_key(prefix, key)
            return await self.redis_client.incrby(cache_key, amount)
        except Exception as e:
            logger.debug(f"Cache increment error: {e}")
            return None

    async def set_with_tags(
        self,
        prefix: str,
        key: str,
        value: Any,
        tags: list[str],
        ttl: int | None = None
    ) -> bool:
        """Set value with tags for batch invalidation"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            # Set the main value
            if not await self.set(prefix, key, value, ttl):
                return False

            # Add key to tag sets
            cache_key = self._make_key(prefix, key)
            for tag in tags:
                tag_key = self._make_key("tag", tag)
                await self.redis_client.sadd(tag_key, cache_key)
                # Set expiry on tag set
                await self.redis_client.expire(tag_key, ttl or self.default_ttl)

            return True
        except Exception as e:
            logger.debug(f"Cache set with tags error: {e}")
            return False

    async def invalidate_tag(self, tag: str) -> int:
        """Invalidate all keys associated with a tag"""
        if not self.enabled or not self.redis_client:
            return 0

        try:
            tag_key = self._make_key("tag", tag)
            keys = await self.redis_client.smembers(tag_key)

            if keys:
                # Delete all keys associated with the tag
                deleted = await self.redis_client.delete(*keys)
                # Delete the tag set itself
                await self.redis_client.delete(tag_key)
                return deleted
            return 0
        except Exception as e:
            logger.debug(f"Cache invalidate tag error: {e}")
            return 0


# Global cache instance
cache = RedisCache()


def cache_key_from_args(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_data = {
        "args": args,
        "kwargs": kwargs
    }
    key_str = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()


def cached(
    prefix: str,
    ttl: int | None = None,
    key_func: Callable | None = None
):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = cache_key_from_args(*args, **kwargs)

            # Try to get from cache
            cached_value = await cache.get(prefix, cache_key)
            if cached_value is not None:
                return cached_value

            # Call the function
            result = await func(*args, **kwargs)

            # Store in cache
            await cache.set(prefix, cache_key, result, ttl)

            return result

        return wrapper
    return decorator
