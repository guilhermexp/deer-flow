# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.database.base import get_db
from src.database.models import User
from .supabase_auth import supabase_auth

# OAuth2 scheme for Supabase tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user using Supabase authentication only."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token from either oauth2_scheme or authorization header
    actual_token = token
    if authorization and not actual_token:
        actual_token = supabase_auth.extract_token_from_header(authorization)
    
    if not actual_token:
        raise credentials_exception
    
    # Use Supabase authentication only
    if not supabase_auth.supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not available",
        )
        
    supabase_user = await supabase_auth.verify_token(actual_token)
    if not supabase_user:
        raise credentials_exception
    
    # Get or create local user
    user = await supabase_auth.get_or_create_local_user(supabase_user, db)
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
