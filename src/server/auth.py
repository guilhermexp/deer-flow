# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging
import os
from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from src.database.base import get_db
from src.database.models import User

from .clerk_auth import clerk_auth

logger = logging.getLogger(__name__)

# OAuth2 scheme for Clerk tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class UserResponse(BaseModel):
    """Serializable user representation for API responses and validation tests."""

    id: int
    email: EmailStr
    username: str
    clerk_id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


async def get_current_user(
    authorization: str | None = Header(None),
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user using Clerk authentication.

    Security hardened implementation:
    - Validates environment configuration
    - Enforces Clerk authentication in production
    - Logs authentication attempts
    - Provides clear error messages

    Args:
        authorization: Authorization header (Bearer token)
        token: OAuth2 token from security scheme
        db: Database session

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: 401 for invalid credentials, 503 for service unavailable
    """
    environment = os.getenv("ENVIRONMENT", "production")

    # Development mode bypass - ONLY if explicitly enabled
    # SECURITY: This should NEVER be enabled in production
    if environment == "development":
        dev_bypass = os.getenv("DEV_AUTH_BYPASS", "false").lower() == "true"
        if dev_bypass:
            logger.warning(
                "⚠️  DEV_AUTH_BYPASS is enabled. Authentication is DISABLED. "
                "This is EXTREMELY INSECURE and should NEVER be used in production!"
            )
            # Get or create development user
            dev_user_email = os.getenv("DEV_USER_EMAIL", "dev@localhost")
            dev_user = db.query(User).filter(User.email == dev_user_email).first()
            if not dev_user:
                dev_user = User(
                    email=dev_user_email,
                    username="dev_user",
                    clerk_id="dev_user_local",
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(dev_user)
                db.commit()
                db.refresh(dev_user)
                logger.info(f"Created development user: {dev_user_email}")
            return dev_user

    # Production authentication - REQUIRED
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract token from either oauth2_scheme or authorization header
    actual_token = token
    if authorization and not actual_token:
        actual_token = clerk_auth.extract_token_from_header(authorization)

    if not actual_token:
        logger.warning(f"Authentication failed: No token provided (environment: {environment})")
        raise credentials_exception

    # Verify Clerk is configured
    if not clerk_auth.clerk_publishable_key:
        logger.error("Clerk authentication not configured but required for authentication")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured. Please contact support.",
        )

    # Verify token with Clerk
    try:
        clerk_user = await clerk_auth.verify_token(actual_token)
        if not clerk_user:
            logger.warning(f"Authentication failed: Invalid token (environment: {environment})")
            raise credentials_exception

        # Get or create local user
        user = await clerk_auth.get_or_create_local_user(clerk_user, db)

        # Verify user is active
        if not user.is_active:
            logger.warning(f"Authentication failed: Inactive user (user_id: {user.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        logger.debug(f"Authentication successful for user: {user.email} (clerk_id: {user.clerk_id})")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication",
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_optional_current_user(
    authorization: str | None = Header(None),
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, None otherwise. Useful for optional auth endpoints."""
    try:
        return await get_current_user(authorization, token, db)
    except HTTPException:
        return None
