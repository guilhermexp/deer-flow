# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

class RateLimiter:
    """Simple in-memory rate limiter for authentication endpoints"""
    
    def __init__(self, requests_per_minute: int = 5, requests_per_hour: int = 50):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.requests: Dict[str, list] = defaultdict(list)
        self.blocked_ips: Dict[str, datetime] = {}
        
    def _clean_old_requests(self, ip: str, current_time: datetime):
        """Remove requests older than 1 hour"""
        one_hour_ago = current_time - timedelta(hours=1)
        self.requests[ip] = [
            req_time for req_time in self.requests[ip] 
            if req_time > one_hour_ago
        ]
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request headers or connection"""
        # Check for forwarded IP (when behind proxy/load balancer)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def check_rate_limit(self, request: Request) -> Tuple[bool, str]:
        """
        Check if request should be allowed based on rate limits
        Returns: (allowed, reason)
        """
        ip = self._get_client_ip(request)
        current_time = datetime.now()
        
        # Check if IP is temporarily blocked
        if ip in self.blocked_ips:
            if current_time < self.blocked_ips[ip]:
                remaining_seconds = (self.blocked_ips[ip] - current_time).seconds
                return False, f"Too many requests. Please try again in {remaining_seconds} seconds."
            else:
                # Unblock IP
                del self.blocked_ips[ip]
        
        # Clean old requests
        self._clean_old_requests(ip, current_time)
        
        # Get requests in last minute and hour
        one_minute_ago = current_time - timedelta(minutes=1)
        requests_last_minute = sum(
            1 for req_time in self.requests[ip] 
            if req_time > one_minute_ago
        )
        requests_last_hour = len(self.requests[ip])
        
        # Check limits
        if requests_last_minute >= self.requests_per_minute:
            # Block IP for 5 minutes
            self.blocked_ips[ip] = current_time + timedelta(minutes=5)
            return False, f"Rate limit exceeded: {self.requests_per_minute} requests per minute"
            
        if requests_last_hour >= self.requests_per_hour:
            # Block IP for 1 hour
            self.blocked_ips[ip] = current_time + timedelta(hours=1)
            return False, f"Rate limit exceeded: {self.requests_per_hour} requests per hour"
        
        # Record this request
        self.requests[ip].append(current_time)
        
        return True, ""

# Global rate limiter instances
auth_rate_limiter = RateLimiter(requests_per_minute=5, requests_per_hour=50)
general_rate_limiter = RateLimiter(requests_per_minute=30, requests_per_hour=500)

async def rate_limit_middleware(request: Request, call_next):
    """Middleware to apply rate limiting to specific endpoints"""
    
    # Only apply rate limiting to specific endpoints
    if request.url.path.startswith("/api/auth/"):
        allowed, reason = auth_rate_limiter.check_rate_limit(request)
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": reason},
                headers={
                    "Retry-After": "300",  # 5 minutes
                    "X-RateLimit-Limit": str(auth_rate_limiter.requests_per_minute),
                }
            )
    
    response = await call_next(request)
    return response