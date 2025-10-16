# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import logging
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from functools import lru_cache

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import jwt
from jwt import PyJWTError
import httpx

from src.database.models import User

logger = logging.getLogger(__name__)


class ClerkAuthMiddleware:
    """Middleware for handling Clerk authentication with JWKS support."""

    def __init__(self):
        """Initialize Clerk auth with JWT verification and JWKS."""
        self.clerk_publishable_key = os.getenv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "")
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY", "")

        # Extract issuer from publishable key if available
        # Clerk publishable keys format: pk_test_xxxxx or pk_live_xxxxx
        self.issuer = None
        if self.clerk_publishable_key:
            # Extract domain from publishable key or use default
            # Format: https://<clerk-domain>
            # For development, we might need to construct this differently
            self.issuer = os.getenv("CLERK_ISSUER", f"https://clerk.{os.getenv('CLERK_DOMAIN', 'example.com')}")

        self.jwks_uri = f"{self.issuer}/.well-known/jwks.json" if self.issuer else None
        self._jwks_cache: Optional[Dict[str, Any]] = None
        self._jwks_cache_time: Optional[datetime] = None
        self._jwks_cache_ttl = timedelta(hours=1)  # Cache JWKS for 1 hour

        if not self.clerk_publishable_key:
            logger.warning("Clerk credentials not configured. Clerk auth will be disabled.")
        else:
            logger.info("Clerk auth middleware initialized with JWKS support")

    @lru_cache(maxsize=128)
    def _get_jwk_for_kid(self, kid: str) -> Optional[Dict[str, Any]]:
        """Get JWK (JSON Web Key) for a specific key ID with caching."""
        jwks = self._fetch_jwks()
        if not jwks:
            return None

        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        return None

    def _fetch_jwks(self, retry_count: int = 3, retry_delay: float = 1.0) -> Optional[Dict[str, Any]]:
        """
        Fetch JWKS from Clerk with retry logic and caching.

        Args:
            retry_count: Number of retry attempts (default: 3)
            retry_delay: Delay between retries in seconds (default: 1.0)

        Returns:
            JWKS dict or None if fetch fails
        """
        # Return cached JWKS if still valid
        if (
            self._jwks_cache
            and self._jwks_cache_time
            and datetime.utcnow() - self._jwks_cache_time < self._jwks_cache_ttl
        ):
            return self._jwks_cache

        if not self.jwks_uri:
            logger.warning("JWKS URI not configured")
            return None

        for attempt in range(retry_count):
            try:
                logger.debug(f"Fetching JWKS from {self.jwks_uri} (attempt {attempt + 1}/{retry_count})")

                with httpx.Client(timeout=10.0) as client:
                    response = client.get(self.jwks_uri)
                    response.raise_for_status()

                    jwks = response.json()
                    self._jwks_cache = jwks
                    self._jwks_cache_time = datetime.utcnow()

                    logger.info(f"Successfully fetched JWKS with {len(jwks.get('keys', []))} keys")
                    return jwks

            except httpx.HTTPError as e:
                logger.warning(f"JWKS fetch attempt {attempt + 1} failed: {str(e)}")
                if attempt < retry_count - 1:
                    time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                else:
                    logger.error(f"Failed to fetch JWKS after {retry_count} attempts")
            except Exception as e:
                logger.error(f"Unexpected error fetching JWKS: {str(e)}")
                break

        return None

    async def verify_token(self, token: str, retry_count: int = 2) -> Optional[dict]:
        """
        Verify a Clerk JWT token and return user data with retry logic.

        Args:
            token: JWT token to verify
            retry_count: Number of retry attempts for token verification (default: 2)

        Returns:
            User data dict or None if verification fails
        """
        if not self.clerk_publishable_key:
            logger.warning("Clerk not configured, skipping token verification")
            return None

        for attempt in range(retry_count):
            try:
                # First, decode without verification to get the header
                unverified_header = jwt.get_unverified_header(token)
                kid = unverified_header.get("kid")

                if not kid:
                    logger.warning("Token missing 'kid' in header")
                    return None

                # Fetch the JWK for this key ID
                jwk = self._get_jwk_for_kid(kid)

                if not jwk:
                    # Try refreshing JWKS cache
                    logger.debug("JWK not found in cache, refreshing JWKS")
                    self._jwks_cache = None  # Force refresh
                    jwk = self._get_jwk_for_kid(kid)

                    if not jwk:
                        logger.warning(f"No JWK found for kid: {kid}")
                        return None

                # Convert JWK to PEM format for PyJWT
                from jwt.algorithms import RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(jwk)

                # Verify and decode the token
                decoded = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    issuer=self.issuer,
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "verify_iat": True,
                        "verify_iss": True,
                    }
                )

                # Extract user information
                clerk_id = decoded.get("sub")
                email = decoded.get("email")

                if not clerk_id:
                    logger.warning("Token missing 'sub' claim")
                    return None

                logger.debug(f"Successfully verified token for clerk_id: {clerk_id}")
                return {
                    "clerk_id": clerk_id,
                    "email": email,
                    "email_verified": decoded.get("email_verified", False),
                    "username": decoded.get("username"),
                    "first_name": decoded.get("first_name"),
                    "last_name": decoded.get("last_name"),
                }

            except jwt.ExpiredSignatureError:
                logger.debug("Token has expired")
                return None
            except jwt.InvalidIssuerError:
                logger.warning(f"Invalid token issuer. Expected: {self.issuer}")
                return None
            except jwt.InvalidTokenError as e:
                logger.debug(f"Token verification failed (attempt {attempt + 1}): {str(e)}")
                if attempt < retry_count - 1:
                    time.sleep(0.5)  # Brief delay before retry
                else:
                    logger.warning(f"Token verification failed after {retry_count} attempts")
            except Exception as e:
                logger.error(f"Unexpected error verifying token: {str(e)}")
                return None

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

        # Try to find by email
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
