# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.base import get_db
from src.database.models import User
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    supabase_id: str

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current authenticated user information.
    Authentication is handled by Supabase.
    """
    return UserResponse.from_orm(current_user)


@router.get("/validate")
async def validate_token(
    current_user: User = Depends(get_current_active_user),
):
    """
    Validate the current authentication token.
    Returns 200 if token is valid, 401 if not.
    """
    return {"valid": True, "user_id": current_user.id}