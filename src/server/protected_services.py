# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Protected service calls with circuit breaker pattern.
This module wraps external service calls with circuit breakers to prevent cascading failures.
"""

import logging
from datetime import datetime
from typing import Optional, Any, Dict
from supabase import Client as SupabaseClient

from src.server.circuit_breaker import circuit_breaker, get_circuit_breaker
from src.server.exceptions import ExternalServiceError, DatabaseError

logger = logging.getLogger(__name__)


class ProtectedSupabaseClient:
    """Supabase client wrapper with circuit breaker protection."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client
        self._auth_breaker = get_circuit_breaker(
            "supabase_auth",
            failure_threshold=3,
            recovery_timeout=30,
            expected_exception=(ExternalServiceError, DatabaseError),
        )
        self._db_breaker = get_circuit_breaker(
            "supabase_db",
            failure_threshold=5,
            recovery_timeout=60,
            expected_exception=(ExternalServiceError, DatabaseError),
        )
    
    @circuit_breaker("supabase_auth", failure_threshold=3, recovery_timeout=30)
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user with circuit breaker protection."""
        try:
            response = self.client.auth.admin.get_user_by_id(user_id)
            return response.user if response else None
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {e}")
            raise ExternalServiceError(
                service="Supabase Auth",
                detail=f"Failed to retrieve user: {str(e)}"
            )
    
    @circuit_breaker("supabase_db", failure_threshold=5, recovery_timeout=60)
    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation with circuit breaker protection."""
        try:
            response = (
                self.client.table("conversations")
                .select("*")
                .eq("id", conversation_id)
                .single()
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {e}")
            raise DatabaseError(f"Failed to retrieve conversation: {str(e)}")
    
    @circuit_breaker("supabase_db", failure_threshold=5, recovery_timeout=60)
    async def save_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save message with circuit breaker protection."""
        try:
            response = (
                self.client.table("messages")
                .insert(message_data)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            raise DatabaseError(f"Failed to save message: {str(e)}")


# LLM calls protection
@circuit_breaker("openai_api", failure_threshold=3, recovery_timeout=45)
async def protected_llm_call(llm_client: Any, prompt: str, **kwargs) -> str:
    """Make LLM API call with circuit breaker protection."""
    try:
        response = await llm_client.agenerate([prompt], **kwargs)
        return response.generations[0][0].text
    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        raise ExternalServiceError(
            service="LLM API",
            detail=f"Failed to generate response: {str(e)}"
        )


# Search API protection
@circuit_breaker("search_api", failure_threshold=5, recovery_timeout=30)
async def protected_search_call(search_func: Any, query: str, **kwargs) -> list:
    """Make search API call with circuit breaker protection."""
    try:
        results = await search_func(query, **kwargs)
        return results
    except Exception as e:
        logger.error(f"Search API call failed: {e}")
        raise ExternalServiceError(
            service="Search API",
            detail=f"Search service unavailable: {str(e)}"
        )


# Add endpoint to check circuit breaker status
async def get_service_health() -> Dict[str, Any]:
    """Get health status of all protected services."""
    from src.server.circuit_breaker import get_all_circuit_breakers
    
    breakers = get_all_circuit_breakers()
    
    # Calculate overall health
    all_closed = all(
        cb["state"] == "closed" 
        for cb in breakers.values()
    )
    
    return {
        "healthy": all_closed,
        "services": breakers,
        "timestamp": datetime.utcnow().isoformat(),
    }