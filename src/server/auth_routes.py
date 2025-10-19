# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from fastapi import APIRouter, Depends

from src.database.models import User
from src.server.auth import get_current_active_user
from src.server.schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current authenticated user information.
    Authentication is handled by Clerk.
    """
    return UserResponse.model_validate(current_user)


@router.get("/validate")
async def validate_token(
    current_user: User = Depends(get_current_active_user),
):
    """
    Validate the current authentication token.
    Returns 200 if token is valid, 401 if not.
    """
    return {"valid": True, "user_id": current_user.id}
