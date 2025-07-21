# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session
from supabase import create_client, Client
import jwt
from jwt import PyJWTError

from src.database.models import User

logger = logging.getLogger(__name__)


class SupabaseAuthMiddleware:
    """Middleware for handling Supabase authentication alongside JWT auth."""
    
    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not configured. Supabase auth will be disabled.")
            self.supabase = None
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)
            logger.info("Supabase auth middleware initialized")
    
    async def verify_token(self, token: str) -> Optional[dict]:
        """Verify a Supabase JWT token and return user data."""
        if not self.supabase:
            return None
            
        try:
            # Decode JWT to get user ID without verification first
            # This is just to get the sub claim
            unverified = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified.get("sub")
            
            if not user_id:
                return None
            
            # Verify token with Supabase
            # Set the auth token for the client
            self.supabase.auth.set_session(token, "")
            user_response = self.supabase.auth.get_user(token)
            
            if user_response and user_response.user:
                return {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                    "email_confirmed": user_response.user.email_confirmed_at is not None,
                    "created_at": user_response.user.created_at,
                    "user_metadata": user_response.user.user_metadata,
                }
            
            return None
            
        except Exception as e:
            logger.debug(f"Supabase token verification failed: {str(e)}")
            return None
    
    async def get_or_create_local_user(
        self, 
        supabase_user: dict,
        db: Session
    ) -> User:
        """Get existing user by supabase_id or create a new one."""
        # First, try to find by supabase_id
        user = db.query(User).filter(
            User.supabase_id == supabase_user["id"]
        ).first()
        
        if user:
            return user
        
        # Try to find by email (migration case)
        user = db.query(User).filter(
            User.email == supabase_user["email"]
        ).first()
        
        if user:
            # Update existing user with supabase_id
            user.supabase_id = supabase_user["id"]
            db.commit()
            logger.info(f"Linked existing user {user.email} with Supabase ID")
            return user
        
        # Create new user
        username = supabase_user.get("user_metadata", {}).get("username")
        if not username:
            # Generate username from email
            username = supabase_user["email"].split("@")[0]
            
            # Ensure unique username
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
        
        user = User(
            email=supabase_user["email"],
            username=username,
            supabase_id=supabase_user["id"],
            # Set a placeholder password hash since Supabase handles auth
            hashed_password="$supabase$managed",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created new user {user.email} from Supabase auth")
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
supabase_auth = SupabaseAuthMiddleware()