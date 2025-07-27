# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import asyncio
import time
import logging
from enum import Enum
from typing import Callable, Optional, Any, Dict
from functools import wraps
from datetime import datetime, timedelta

from src.server.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker implementation for protecting against cascading failures.
    
    The circuit breaker has three states:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Service is failing, requests are rejected immediately
    - HALF_OPEN: Testing if service has recovered
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
        success_threshold: int = 2,
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Name of the service/resource being protected
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery
            expected_exception: Exception type to catch (others will pass through)
            success_threshold: Successes needed in half-open state to close circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.success_threshold = success_threshold
        
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._last_state_change = time.time()
        self._lock = asyncio.Lock()
        
        # Metrics
        self._metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "rejected_calls": 0,
            "state_changes": 0,
        }
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state
    
    @property
    def metrics(self) -> Dict[str, int]:
        """Get circuit breaker metrics."""
        return self._metrics.copy()
    
    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit."""
        return (
            self._last_failure_time is not None
            and time.time() - self._last_failure_time >= self.recovery_timeout
        )
    
    async def _record_success(self):
        """Record a successful call."""
        async with self._lock:
            self._metrics["successful_calls"] += 1
            
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._set_state(CircuitState.CLOSED)
                    self._failure_count = 0
                    self._success_count = 0
                    logger.info(f"Circuit breaker '{self.name}' closed after recovery")
    
    async def _record_failure(self):
        """Record a failed call."""
        async with self._lock:
            self._metrics["failed_calls"] += 1
            self._failure_count += 1
            self._last_failure_time = time.time()
            
            if self._state == CircuitState.CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._set_state(CircuitState.OPEN)
                    logger.warning(
                        f"Circuit breaker '{self.name}' opened after "
                        f"{self._failure_count} failures"
                    )
            elif self._state == CircuitState.HALF_OPEN:
                self._set_state(CircuitState.OPEN)
                self._success_count = 0
                logger.warning(
                    f"Circuit breaker '{self.name}' reopened after failure in half-open state"
                )
    
    def _set_state(self, state: CircuitState):
        """Set circuit state and record metrics."""
        if self._state != state:
            self._state = state
            self._last_state_change = time.time()
            self._metrics["state_changes"] += 1
            logger.info(f"Circuit breaker '{self.name}' state changed to {state.value}")
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Call the protected function.
        
        Args:
            func: Function to call
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            ExternalServiceError: If circuit is open
            Exception: If function fails
        """
        async with self._lock:
            self._metrics["total_calls"] += 1
            
            # Check if we should transition from OPEN to HALF_OPEN
            if self._state == CircuitState.OPEN and self._should_attempt_reset():
                self._set_state(CircuitState.HALF_OPEN)
                self._failure_count = 0
                logger.info(f"Circuit breaker '{self.name}' half-open for testing")
            
            # Reject if circuit is open
            if self._state == CircuitState.OPEN:
                self._metrics["rejected_calls"] += 1
                raise ExternalServiceError(
                    service=self.name,
                    detail=f"Circuit breaker is open. Service '{self.name}' is unavailable."
                )
        
        # Try to execute the function
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            await self._record_success()
            return result
            
        except self.expected_exception as e:
            await self._record_failure()
            raise
        except Exception:
            # Don't record unexpected exceptions as failures
            raise
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator usage of circuit breaker."""
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await self.call(func, *args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions, we need to run in event loop
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.call(func, *args, **kwargs))
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper


# Global circuit breakers for different services
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    expected_exception: type = Exception,
    success_threshold: int = 2,
) -> CircuitBreaker:
    """
    Get or create a circuit breaker for a service.
    
    Args:
        name: Service name
        failure_threshold: Failures before opening
        recovery_timeout: Recovery timeout in seconds
        expected_exception: Exception type to catch
        success_threshold: Successes needed to close
        
    Returns:
        Circuit breaker instance
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            expected_exception=expected_exception,
            success_threshold=success_threshold,
        )
    return _circuit_breakers[name]


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    expected_exception: type = Exception,
    success_threshold: int = 2,
) -> Callable:
    """
    Decorator to apply circuit breaker to a function.
    
    Usage:
        @circuit_breaker("external_api", failure_threshold=3)
        async def call_external_api():
            ...
    """
    def decorator(func: Callable) -> Callable:
        cb = get_circuit_breaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            expected_exception=expected_exception,
            success_threshold=success_threshold,
        )
        return cb(func)
    
    return decorator


def get_all_circuit_breakers() -> Dict[str, Dict[str, Any]]:
    """Get status of all circuit breakers."""
    return {
        name: {
            "state": cb.state.value,
            "metrics": cb.metrics,
        }
        for name, cb in _circuit_breakers.items()
    }