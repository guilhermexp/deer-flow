# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from fastapi import HTTPException
from jose import jwt

from src.server.auth import get_current_user
from src.database.models import User

# Mock environment variables for testing
@pytest.fixture(autouse=True)
def mock_env_vars():
    with patch.dict(os.environ, {
        'JWT_SECRET_KEY': 'test-secret-key-for-testing-only',
        'SUPABASE_URL': '',
        'SUPABASE_ANON_KEY': ''
    }):
        yield


class TestDualAuthentication:
    """Test dual authentication support (JWT + Supabase)."""
    
    @pytest.mark.asyncio
    async def test_jwt_auth_success(self):
        """Test successful Supabase authentication."""
        token = "mock-supabase-token"
        
        # Mock database
        db = Mock()
        mock_user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            is_active=True
        )
        
        # Mock Supabase auth verification
        with patch('src.server.supabase_auth.supabase_auth.verify_token', new_callable=AsyncMock) as mock_verify:
            with patch('src.server.supabase_auth.supabase_auth.get_or_create_local_user', new_callable=AsyncMock) as mock_get_user:
                mock_verify.return_value = {"sub": "testuser", "email": "test@example.com"}
                mock_get_user.return_value = mock_user
                
                # Test authentication
                result = await get_current_user(
                    authorization=None,
                    token=token,
                    db=db
                )
                
                assert result == mock_user
                mock_verify.assert_called_once_with(token)
                mock_get_user.assert_called_once_with({"sub": "testuser", "email": "test@example.com"}, db)
    
    @pytest.mark.asyncio
    @patch('src.server.auth.supabase_auth')
    async def test_supabase_auth_success(self, mock_supabase_auth):
        """Test successful Supabase authentication."""
        # Mock Supabase auth
        mock_supabase_auth.supabase = Mock()
        mock_supabase_auth.extract_token_from_header.return_value = "supabase-token"
        mock_supabase_auth.verify_token = AsyncMock(return_value={
            "id": "user-123",
            "email": "test@example.com"
        })
        
        mock_user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            supabase_id="user-123",
            is_active=True
        )
        
        mock_supabase_auth.get_or_create_local_user = AsyncMock(
            return_value=mock_user
        )
        
        # Mock database
        db = Mock()
        
        # Test authentication with authorization header
        result = await get_current_user(
            authorization="Bearer supabase-token",
            token=None,
            db=db
        )
        
        assert result == mock_user
        mock_supabase_auth.verify_token.assert_called_once_with("supabase-token")
    
    @pytest.mark.asyncio
    async def test_invalid_jwt_falls_back_to_supabase(self):
        """Test that invalid JWT falls back to Supabase auth."""
        # Create an invalid JWT token
        invalid_token = "invalid.jwt.token"
        
        # Mock Supabase auth
        with patch('src.server.auth.supabase_auth') as mock_supabase_auth:
            mock_supabase_auth.supabase = Mock()
            mock_supabase_auth.verify_token = AsyncMock(return_value={
                "id": "user-123",
                "email": "test@example.com"
            })
            
            mock_user = User(
                id=1,
                username="testuser",
                email="test@example.com",
                supabase_id="user-123",
                is_active=True
            )
            
            mock_supabase_auth.get_or_create_local_user = AsyncMock(
                return_value=mock_user
            )
            
            # Mock database
            db = Mock()
            
            # Test authentication
            result = await get_current_user(
                authorization=None,
                token=invalid_token,
                db=db
            )
            
            assert result == mock_user
            mock_supabase_auth.verify_token.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_no_token_raises_exception(self):
        """Test that no token raises authentication exception."""
        db = Mock()
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                authorization=None,
                token=None,
                db=db
            )
        
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Could not validate credentials"
    
    @pytest.mark.asyncio
    @patch('src.server.auth.supabase_auth')
    async def test_both_auth_methods_fail(self, mock_supabase_auth):
        """Test exception when both auth methods fail."""
        # Create an invalid JWT token
        invalid_token = "invalid.jwt.token"
        
        # Mock Supabase auth to fail
        mock_supabase_auth.supabase = Mock()
        mock_supabase_auth.verify_token = AsyncMock(return_value=None)
        
        # Mock database
        db = Mock()
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                authorization=None,
                token=invalid_token,
                db=db
            )
        
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Could not validate credentials"
    
    @pytest.mark.asyncio
    async def test_jwt_user_not_found(self):
        """Test JWT auth when user is not found in database."""
        # Create a valid JWT token for non-existent user
        token_data = {
            "sub": "nonexistent",
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        # Mock database to return None
        db = Mock()
        query_mock = Mock()
        query_mock.filter.return_value.first.return_value = None
        db.query.return_value = query_mock
        
        # Mock Supabase auth to also fail
        with patch('src.server.auth.supabase_auth') as mock_supabase_auth:
            mock_supabase_auth.supabase = Mock()
            mock_supabase_auth.verify_token = AsyncMock(return_value=None)
            
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(
                    authorization=None,
                    token=token,
                    db=db
                )
            
            assert exc_info.value.status_code == 401