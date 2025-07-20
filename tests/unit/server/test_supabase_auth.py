# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from sqlalchemy.orm import Session

from src.server.supabase_auth import SupabaseAuthMiddleware
from src.database.models import User


class TestSupabaseAuthMiddleware:
    """Test cases for Supabase authentication middleware."""
    
    @patch('src.server.supabase_auth.create_client')
    def test_init_with_credentials(self, mock_create_client):
        """Test initialization with valid credentials."""
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-key'
        }):
            middleware = SupabaseAuthMiddleware()
            mock_create_client.assert_called_once_with(
                'https://test.supabase.co',
                'test-key'
            )
            assert middleware.supabase is not None
    
    def test_init_without_credentials(self):
        """Test initialization without credentials."""
        with patch.dict('os.environ', {}, clear=True):
            middleware = SupabaseAuthMiddleware()
            assert middleware.supabase is None
    
    def test_extract_token_from_header(self):
        """Test token extraction from authorization header."""
        middleware = SupabaseAuthMiddleware()
        
        # Valid bearer token
        token = middleware.extract_token_from_header("Bearer test-token-123")
        assert token == "test-token-123"
        
        # Invalid format
        assert middleware.extract_token_from_header("InvalidFormat") is None
        assert middleware.extract_token_from_header("") is None
        assert middleware.extract_token_from_header(None) is None
    
    @pytest.mark.asyncio
    async def test_verify_token_no_client(self):
        """Test token verification when Supabase client is not configured."""
        middleware = SupabaseAuthMiddleware()
        middleware.supabase = None
        
        result = await middleware.verify_token("any-token")
        assert result is None
    
    @pytest.mark.asyncio
    @patch('jwt.decode')
    async def test_verify_token_success(self, mock_jwt_decode):
        """Test successful token verification."""
        middleware = SupabaseAuthMiddleware()
        middleware.supabase = Mock()
        
        # Mock JWT decode
        mock_jwt_decode.return_value = {"sub": "user-123"}
        
        # Mock Supabase response
        mock_user = Mock()
        mock_user.id = "user-123"
        mock_user.email = "test@example.com"
        mock_user.email_confirmed_at = "2025-01-01"
        mock_user.created_at = "2025-01-01"
        mock_user.user_metadata = {"username": "testuser"}
        
        mock_response = Mock()
        mock_response.user = mock_user
        
        middleware.supabase.auth.get_user = Mock(return_value=mock_response)
        middleware.supabase.auth.set_session = Mock()
        
        result = await middleware.verify_token("valid-token")
        
        assert result is not None
        assert result["id"] == "user-123"
        assert result["email"] == "test@example.com"
        assert result["email_confirmed"] is True
    
    @pytest.mark.asyncio
    async def test_get_or_create_local_user_existing_by_supabase_id(self):
        """Test getting existing user by supabase_id."""
        middleware = SupabaseAuthMiddleware()
        
        # Mock database session
        db = Mock(spec=Session)
        
        # Mock existing user
        existing_user = User(
            id=1,
            email="test@example.com",
            username="testuser",
            supabase_id="user-123"
        )
        
        # Setup query chain
        query_mock = Mock()
        query_mock.filter.return_value.first.return_value = existing_user
        db.query.return_value = query_mock
        
        supabase_user = {
            "id": "user-123",
            "email": "test@example.com"
        }
        
        result = await middleware.get_or_create_local_user(supabase_user, db)
        
        assert result == existing_user
        db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_or_create_local_user_existing_by_email(self):
        """Test getting existing user by email and updating supabase_id."""
        middleware = SupabaseAuthMiddleware()
        
        # Mock database session
        db = Mock(spec=Session)
        
        # Mock existing user without supabase_id
        existing_user = User(
            id=1,
            email="test@example.com",
            username="testuser",
            supabase_id=None
        )
        
        # Setup query chain - first query returns None, second returns user
        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.first.side_effect = [None, existing_user]
        query_mock.filter.return_value = filter_mock
        db.query.return_value = query_mock
        
        supabase_user = {
            "id": "user-123",
            "email": "test@example.com"
        }
        
        result = await middleware.get_or_create_local_user(supabase_user, db)
        
        assert result == existing_user
        assert result.supabase_id == "user-123"
        db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_or_create_local_user_new_user(self):
        """Test creating a new user from Supabase data."""
        middleware = SupabaseAuthMiddleware()
        
        # Mock database session
        db = Mock(spec=Session)
        
        # Setup query chain - all queries return None (no existing user)
        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.first.return_value = None
        query_mock.filter.return_value = filter_mock
        db.query.return_value = query_mock
        
        supabase_user = {
            "id": "user-123",
            "email": "newuser@example.com",
            "user_metadata": {"username": "newuser"}
        }
        
        # Mock the add/commit/refresh process
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        result = await middleware.get_or_create_local_user(supabase_user, db)
        
        # Verify user was created
        db.add.assert_called_once()
        created_user = db.add.call_args[0][0]
        assert isinstance(created_user, User)
        assert created_user.email == "newuser@example.com"
        assert created_user.username == "newuser"
        assert created_user.supabase_id == "user-123"
        assert created_user.hashed_password == "$supabase$managed"
        assert created_user.is_active is True
    
    @pytest.mark.asyncio
    async def test_get_or_create_local_user_username_from_email(self):
        """Test creating username from email when not provided."""
        middleware = SupabaseAuthMiddleware()
        
        # Mock database session
        db = Mock(spec=Session)
        
        # Setup query chain
        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.first.return_value = None
        query_mock.filter.return_value = filter_mock
        db.query.return_value = query_mock
        
        supabase_user = {
            "id": "user-123",
            "email": "johndoe@example.com",
            "user_metadata": {}  # No username in metadata
        }
        
        # Mock the add/commit/refresh process
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        result = await middleware.get_or_create_local_user(supabase_user, db)
        
        # Verify username was generated from email
        created_user = db.add.call_args[0][0]
        assert created_user.username == "johndoe"