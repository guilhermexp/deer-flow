# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import time
import psutil
import platform
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database.base import get_db, engine
from src.server.cache import cache


class HealthChecker:
    """Comprehensive health check system"""
    
    @staticmethod
    async def check_database() -> Dict[str, Any]:
        """Check database connectivity and performance

        Uses generic SQL (SELECT 1) compatible with both SQLite and PostgreSQL.
        Database-specific statistics are only collected when using PostgreSQL.
        """
        start_time = time.time()
        status = "healthy"
        details = {}

        try:
            # Test database connection with generic SQL compatible with SQLite and PostgreSQL
            with next(get_db()) as db:
                result = db.execute(text("SELECT 1")).scalar()
                if result != 1:
                    raise Exception("Database query returned unexpected result")

                # Detect database type
                db_name = db.bind.dialect.name
                details["database_type"] = db_name

                # Get database-specific statistics only for PostgreSQL
                if db_name == "postgresql":
                    try:
                        db_stats = db.execute(text("""
                            SELECT
                                count(*) as connection_count,
                                state,
                                wait_event_type
                            FROM pg_stat_activity
                            WHERE datname = current_database()
                            GROUP BY state, wait_event_type
                        """)).fetchall()

                        details["connections"] = {
                            "active": sum(row.connection_count for row in db_stats if row.state == 'active'),
                            "idle": sum(row.connection_count for row in db_stats if row.state == 'idle'),
                            "total": sum(row.connection_count for row in db_stats)
                        }
                    except Exception as pg_error:
                        # PostgreSQL stats are optional - don't fail the health check
                        details["connections"] = {"error": f"Could not fetch PostgreSQL stats: {str(pg_error)}"}
                else:
                    details["connections"] = {"message": f"Connection statistics not available for {db_name}"}

                # Check table counts using generic SQL
                tables = ['users', 'conversations', 'messages', 'tasks', 'notes']
                for table in tables:
                    try:
                        count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                        details[f"{table}_count"] = count
                    except Exception as table_error:
                        # Table might not exist - continue with other tables
                        details[f"{table}_count"] = f"Error: {str(table_error)}"

        except Exception as e:
            status = "unhealthy"
            details["error"] = str(e)

        response_time = (time.time() - start_time) * 1000  # Convert to ms

        return {
            "service": "database",
            "status": status,
            "response_time_ms": round(response_time, 2),
            "details": details
        }
    
    @staticmethod
    async def check_redis() -> Dict[str, Any]:
        """Check Redis connectivity and performance"""
        start_time = time.time()
        status = "healthy"
        details = {}
        
        try:
            if not cache.enabled:
                status = "disabled"
                details["message"] = "Cache is disabled"
            elif cache.redis_client:
                # Test Redis connection
                pong = await cache.redis_client.ping()
                if not pong:
                    raise Exception("Redis ping failed")
                
                # Get Redis info
                info = await cache.redis_client.info()
                details["version"] = info.get("redis_version", "unknown")
                details["connected_clients"] = info.get("connected_clients", 0)
                details["used_memory_human"] = info.get("used_memory_human", "unknown")
                details["uptime_days"] = info.get("uptime_in_days", 0)
                
                # Test cache operations
                test_key = "health_check_test"
                await cache.set("health", test_key, {"timestamp": time.time()}, ttl=60)
                test_value = await cache.get("health", test_key)
                if not test_value:
                    raise Exception("Cache set/get test failed")
                await cache.delete("health", test_key)
                
            else:
                status = "unhealthy"
                details["error"] = "Redis client not initialized"
                
        except Exception as e:
            status = "unhealthy"
            details["error"] = str(e)
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            "service": "redis",
            "status": status,
            "response_time_ms": round(response_time, 2),
            "details": details
        }
    
    
    @staticmethod
    async def check_external_apis() -> Dict[str, Any]:
        """Check external API configurations"""
        apis = {
            "tavily": bool(os.getenv("TAVILY_API_KEY")),
            "google": bool(os.getenv("GOOGLE_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "volcengine_tts": bool(os.getenv("VOLCENGINE_TTS_APPID")),
            "ragflow": bool(os.getenv("RAGFLOW_API_KEY")),
        }
        
        configured_count = sum(apis.values())
        total_count = len(apis)
        
        return {
            "service": "external_apis",
            "status": "healthy" if configured_count > 0 else "warning",
            "details": {
                "configured": configured_count,
                "total": total_count,
                "apis": apis
            }
        }
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get system resource information"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "python_version": platform.python_version(),
            "cpu": {
                "count": psutil.cpu_count(),
                "usage_percent": cpu_percent,
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "used_percent": disk.percent
            }
        }
    
    @classmethod
    async def check_all(cls) -> Dict[str, Any]:
        """Run all health checks"""
        start_time = time.time()
        
        # Run all checks
        checks = {
            "database": await cls.check_database(),
            "redis": await cls.check_redis(),
            "external_apis": await cls.check_external_apis(),
        }
        
        # Determine overall status
        statuses = [check["status"] for check in checks.values()]
        if "unhealthy" in statuses:
            overall_status = "unhealthy"
        elif "warning" in statuses or "disabled" in statuses:
            overall_status = "degraded"
        else:
            overall_status = "healthy"
        
        total_time = (time.time() - start_time) * 1000
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "0.1.0",  # Get from project config
            "checks": checks,
            "system": cls.get_system_info(),
            "total_check_time_ms": round(total_time, 2)
        }
