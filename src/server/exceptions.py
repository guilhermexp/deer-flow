# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import Dict, Optional, Any
from fastapi import HTTPException


class DeerFlowException(HTTPException):
    """Base exception for all DeerFlow errors."""
    
    error_code: str = "DEERFLOW_ERROR"
    
    def __init__(
        self,
        detail: str,
        status_code: int = 500,
        headers: Optional[Dict[str, str]] = None,
        error_code: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code or self.error_code
        self.extra_data = extra_data or {}


class AuthenticationError(DeerFlowException):
    """Raised when authentication fails."""
    
    error_code = "AUTH_ERROR"
    
    def __init__(self, detail: str = "Authentication failed", headers: Optional[Dict[str, str]] = None):
        super().__init__(detail=detail, status_code=401, headers=headers)


class AuthorizationError(DeerFlowException):
    """Raised when user lacks required permissions."""
    
    error_code = "FORBIDDEN"
    
    def __init__(self, detail: str = "Insufficient permissions", headers: Optional[Dict[str, str]] = None):
        super().__init__(detail=detail, status_code=403, headers=headers)


class NotFoundError(DeerFlowException):
    """Raised when a requested resource is not found."""
    
    error_code = "NOT_FOUND"
    
    def __init__(self, resource: str = "Resource", headers: Optional[Dict[str, str]] = None):
        detail = f"{resource} not found"
        super().__init__(detail=detail, status_code=404, headers=headers)


class ValidationError(DeerFlowException):
    """Raised when request validation fails."""
    
    error_code = "VALIDATION_ERROR"
    
    def __init__(
        self,
        detail: str = "Validation error",
        errors: Optional[list] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(
            detail=detail,
            status_code=422,
            headers=headers,
            extra_data={"errors": errors} if errors else {}
        )


class RateLimitError(DeerFlowException):
    """Raised when rate limit is exceeded."""
    
    error_code = "RATE_LIMIT"
    
    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        if headers is None:
            headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        super().__init__(detail=detail, status_code=429, headers=headers)


class ExternalServiceError(DeerFlowException):
    """Raised when an external service fails."""
    
    error_code = "EXTERNAL_SERVICE_ERROR"
    
    def __init__(
        self,
        service: str,
        detail: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        detail = detail or f"External service '{service}' is unavailable"
        super().__init__(
            detail=detail,
            status_code=503,
            headers=headers,
            extra_data={"service": service}
        )


class ConfigurationError(DeerFlowException):
    """Raised when there's a configuration issue."""
    
    error_code = "CONFIG_ERROR"
    
    def __init__(self, detail: str = "Configuration error", headers: Optional[Dict[str, str]] = None):
        super().__init__(detail=detail, status_code=500, headers=headers)


class LLMError(DeerFlowException):
    """Raised when LLM operations fail."""
    
    error_code = "LLM_ERROR"
    
    def __init__(
        self,
        detail: str = "LLM operation failed",
        model: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(
            detail=detail,
            status_code=500,
            headers=headers,
            extra_data={"model": model} if model else {}
        )


class DatabaseError(DeerFlowException):
    """Raised when database operations fail."""
    
    error_code = "DATABASE_ERROR"
    
    def __init__(self, detail: str = "Database operation failed", headers: Optional[Dict[str, str]] = None):
        super().__init__(detail=detail, status_code=500, headers=headers)


class FileProcessingError(DeerFlowException):
    """Raised when file processing fails."""
    
    error_code = "FILE_PROCESSING_ERROR"
    
    def __init__(
        self,
        detail: str = "File processing failed",
        filename: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(
            detail=detail,
            status_code=400,
            headers=headers,
            extra_data={"filename": filename} if filename else {}
        )