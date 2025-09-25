# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Detailed error information."""
    
    field: Optional[str] = Field(None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")


class ErrorResponse(BaseModel):
    """Standard error response model."""
    
    error_code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[List[ErrorDetail]] = Field(None, description="Detailed error information")
    request_id: str = Field(..., description="Unique request identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    status_code: int = Field(..., description="HTTP status code")
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Additional error context")

    class Config:
        json_schema_extra = {
            "example": {
                "error_code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": [
                    {
                        "field": "email",
                        "message": "Invalid email format",
                        "code": "invalid_format"
                    }
                ],
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2024-01-01T00:00:00Z",
                "status_code": 422
            }
        }


class ValidationErrorResponse(ErrorResponse):
    """Validation error response model."""
    
    error_code: str = Field(default="VALIDATION_ERROR")
    status_code: int = Field(default=422)


class AuthenticationErrorResponse(ErrorResponse):
    """Authentication error response model."""
    
    error_code: str = Field(default="AUTH_ERROR")
    status_code: int = Field(default=401)


class RateLimitErrorResponse(ErrorResponse):
    """Rate limit error response model."""
    
    error_code: str = Field(default="RATE_LIMIT")
    status_code: int = Field(default=429)
    retry_after: Optional[int] = Field(None, description="Seconds until rate limit resets")


class SuccessResponse(BaseModel):
    """Standard success response model."""
    
    success: bool = Field(default=True)
    message: Optional[str] = Field(None, description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    request_id: str = Field(..., description="Unique request identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {"id": "123", "name": "Example"},
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }