# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Unified API schemas for DeerFlow.

This module centralizes all Pydantic schemas used across the API,
ensuring consistency between backend validation and OpenAPI documentation.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    """
    Unified user response schema for API responses.

    This schema is used across all endpoints that return user data,
    ensuring consistent structure and validation.
    """

    id: int = Field(..., description="User database ID", examples=[1])
    email: EmailStr = Field(..., description="User email address", examples=["user@example.com"])
    username: str = Field(
        ...,
        description="Username",
        min_length=1,
        max_length=100,
        examples=["user123"]
    )
    clerk_id: str = Field(
        ...,
        description="Clerk user ID",
        min_length=1,
        examples=["user_2xxxxxxxxxxxxx"]
    )
    is_active: bool = Field(
        default=True,
        description="User account active status",
        examples=[True]
    )
    created_at: datetime = Field(
        ...,
        description="Account creation timestamp (UTC)",
        examples=["2025-01-15T10:30:00Z"]
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp (UTC)",
        examples=["2025-01-15T10:30:00Z"]
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy models
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "user123",
                "clerk_id": "user_2xxxxxxxxxxxxx",
                "is_active": True,
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z",
            }
        }

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        """Ensure datetime fields are properly parsed."""
        if isinstance(v, str):
            from datetime import datetime
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v


class UserCreateRequest(BaseModel):
    """Schema for creating a new user."""

    email: EmailStr = Field(..., description="User email address")
    username: str = Field(
        ...,
        description="Username",
        min_length=3,
        max_length=100
    )
    clerk_id: str = Field(..., description="Clerk user ID")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "username": "newuser123",
                "clerk_id": "user_2xxxxxxxxxxxxx",
            }
        }


class UserUpdateRequest(BaseModel):
    """Schema for updating user information."""

    email: EmailStr | None = Field(None, description="User email address")
    username: str | None = Field(
        None,
        description="Username",
        min_length=3,
        max_length=100
    )
    is_active: bool | None = Field(None, description="User account active status")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "updated@example.com",
                "username": "updateduser",
                "is_active": True,
            }
        }


# Export all schemas for easy importing
__all__ = [
    "UserResponse",
    "UserCreateRequest",
    "UserUpdateRequest",
]
