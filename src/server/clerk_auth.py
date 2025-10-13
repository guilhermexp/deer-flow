# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import jwt
from jwt import PyJWTError

from src.database.models import User

logger = logging.getLogger(__name__)


class ClerkAuthMiddleware:
    """Middleware for handling Clerk authentication."""

    def __init__(self):
        """Initialize Clerk auth with JWT verification."""
        self.clerk_publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY", "")

        if not self.clerk_publishable_key:
            logger.warning("Clerk credentials not configured. Clerk auth will be disabled.")
        else:
            logger.info("Clerk auth middleware initialized")

    async def verify_token(self, token: str) -> Optional[dict]:
        """Verify a Clerk JWT token and return user data."""
        if not self.clerk_publishable_key:
            return None

        try:
            # Decode JWT - Clerk uses RS256 algorithm
            # In production, you should fetch and cache the public keys from Clerk's JWKS endpoint
            # https://clerk.com/.well-known/jwks.json

            # For now, we'll decode without verification to get the claims
            # SECURITY: This should be replaced with proper JWT verification using Clerk's public keys
            unverified = jwt.decode(token, options={"verify_signature": False})

            # Extract Clerk user ID from 'sub' claim
            clerk_id = unverified.get("sub")
            email = unverified.get("email")

            if not clerk_id:
                return None

            return {
                "clerk_id": clerk_id,
                "email": email,
                "email_verified": unverified.get("email_verified", False),
                "username": unverified.get("username"),
                "first_name": unverified.get("first_name"),
                "last_name": unverified.get("last_name"),
            }

        except Exception as e:
            logger.debug(f"Clerk token verification failed: {str(e)}")
            return None

    async def get_or_create_local_user(
        self,
        clerk_user: dict,
        db: Session
    ) -> User:
        """Get existing user by clerk_id or create a new one."""
        # First, try to find by clerk_id
        user = db.query(User).filter(
            User.clerk_id == clerk_user["clerk_id"]
        ).first()

        if user:
            # Update email if changed
            if user.email != clerk_user["email"]:
                user.email = clerk_user["email"]
                user.updated_at = datetime.utcnow()
                db.commit()
            return user

        # Try to find by email (migration case from Supabase)
        user = db.query(User).filter(
            User.email == clerk_user["email"]
        ).first()

        if user:
            # Update existing user with clerk_id
            user.clerk_id = clerk_user["clerk_id"]
            user.updated_at = datetime.utcnow()
            db.commit()
            logger.info(f"Linked existing user {user.email} with Clerk ID")
            return user

        # Generate username
        username = clerk_user.get("username")
        if not username:
            # Generate from email or name
            if clerk_user.get("first_name"):
                username = clerk_user["first_name"].lower()
            else:
                username = clerk_user["email"].split("@")[0]

            # Ensure unique username
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

        # Create new user
        user = User(
            email=clerk_user["email"],
            username=username,
            clerk_id=clerk_user["clerk_id"],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"Created new user {user.email} from Clerk auth")
        return user

    def extract_token_from_header(self, authorization: str) -> Optional[str]:
        """Extract bearer token from Authorization header."""
        if not authorization:
            return None

        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

        return None


# Global instance
clerk_auth = ClerkAuthMiddleware()
