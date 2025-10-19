import json
import os
import time
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import httpx
import jwt
import pytest
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException, status
from jwt.algorithms import RSAAlgorithm
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.config.settings import AuthConfig
from src.server.clerk_auth import ClerkAuthMiddleware


@pytest.fixture(scope="function")
def auth_module(monkeypatch):
    monkeypatch.setenv("LANGGRAPH_CHECKPOINT_SAVER", "false")
    monkeypatch.setenv("LANGGRAPH_CHECKPOINT_DB_URL", "")

    clerk_patch = patch("src.server.clerk_auth.ClerkAuthMiddleware")
    engine_patch = patch("src.database.base.create_engine")
    clerk_patch.start()
    engine_patch.start()

    import importlib

    module = importlib.import_module("src.server.auth")

    yield module

    clerk_patch.stop()
    engine_patch.stop()


class TestAuthConfig:
    """Test AuthConfig validation with ENVIRONMENT and JWT_SECRET_KEY."""

    def test_valid_environment_development(self):
        """Test valid development environment configuration."""
        config = AuthConfig(
            environment="development",
            jwt_secret_key="a" * 32,
            cors_allowed_origins=["http://localhost:4000"]
        )
        assert config.environment == "development"

    def test_valid_environment_production(self):
        """Test valid production environment configuration."""
        config = AuthConfig(
            environment="production",
            jwt_secret_key="a" * 32,
            cors_allowed_origins=["https://example.com"]
        )
        assert config.environment == "production"

    def test_invalid_environment(self):
        """Test invalid environment value raises error."""
        with pytest.raises(ValidationError) as exc_info:
            AuthConfig(
                environment="invalid",
                jwt_secret_key="a" * 32
            )
        assert "ENVIRONMENT must be one of" in str(exc_info.value)

    def test_jwt_secret_key_min_length(self):
        """Test JWT_SECRET_KEY minimum length validation."""
        with pytest.raises(ValidationError) as exc_info:
            AuthConfig(
                environment="development",
                jwt_secret_key="short"
            )
        assert "at least 32 characters" in str(exc_info.value)

    def test_jwt_secret_key_weak_value_production(self):
        """Test weak JWT_SECRET_KEY in production raises error."""
        with pytest.raises(ValidationError) as exc_info:
            AuthConfig(
                environment="production",
                jwt_secret_key="your-secure-random-key-here"
            )
        assert "default/weak value in production" in str(exc_info.value)

    def test_jwt_secret_key_weak_value_development(self):
        """Test weak JWT_SECRET_KEY in development shows warning."""
        with pytest.warns(UserWarning, match="weak value"):
            config = AuthConfig(
                environment="development",
                jwt_secret_key="your-secure-random-key-here"
            )
        assert config.jwt_secret_key == "your-secure-random-key-here"

    def test_cors_localhost_production_validation(self):
        """Test CORS localhost origins rejected in production."""
        with pytest.raises(ValidationError) as exc_info:
            AuthConfig(
                environment="production",
                jwt_secret_key="a" * 32,
                cors_allowed_origins=["http://localhost:4000"]
            )
        assert "localhost" in str(exc_info.value)

    def test_cors_origins_parsing_string(self):
        """Test CORS origins parsed from comma-separated string."""
        config = AuthConfig(
            environment="development",
            jwt_secret_key="a" * 32,
            cors_allowed_origins="http://localhost:4000, http://localhost:3000"
        )
        assert len(config.cors_allowed_origins) == 2
        assert "http://localhost:4000" in config.cors_allowed_origins

    def test_cors_origins_parsing_list(self):
        """Test CORS origins parsed from list."""
        config = AuthConfig(
            environment="development",
            jwt_secret_key="a" * 32,
            cors_allowed_origins=["http://localhost:4000", "http://localhost:3000"]
        )
        assert len(config.cors_allowed_origins) == 2


class TestClerkAuthMiddleware:
    """Test Clerk authentication with retry logic and JWKS."""

    @pytest.fixture
    def clerk_auth(self):
        """Create ClerkAuthMiddleware instance for testing."""
        with patch.dict(os.environ, {
            "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_xxxxx",
            "CLERK_ISSUER": "https://test.clerk.accounts.dev",
            "CLERK_DOMAIN": "test.clerk.accounts.dev"
        }):
            return ClerkAuthMiddleware()

    @pytest.fixture
    def rsa_keys(self):
        """Generate RSA key pair for JWT testing."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()

        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )

        return private_key, public_key, private_pem

    @pytest.fixture
    def mock_jwks(self, rsa_keys):
        """Create mock JWKS response."""
        _, public_key, _ = rsa_keys
        jwk_json = RSAAlgorithm.to_jwk(public_key)
        jwk_dict = json.loads(jwk_json)
        jwk_dict['kid'] = 'test-key-id'
        jwk_dict['use'] = 'sig'
        jwk_dict['alg'] = 'RS256'

        return {
            "keys": [jwk_dict]
        }

    def test_initialization_with_config(self, clerk_auth):
        """Test ClerkAuthMiddleware initialization with config."""
        assert clerk_auth.clerk_publishable_key == "pk_test_xxxxx"
        assert clerk_auth.issuer == "https://test.clerk.accounts.dev"
        assert clerk_auth.jwks_uri == "https://test.clerk.accounts.dev/.well-known/jwks.json"

    def test_initialization_without_config(self):
        """Test ClerkAuthMiddleware initialization without config."""
        with patch.dict(os.environ, {}, clear=True):
            auth = ClerkAuthMiddleware()
            assert auth.clerk_publishable_key == ""
            assert auth.issuer is None

    @pytest.mark.asyncio
    async def test_fetch_jwks_success(self, clerk_auth, mock_jwks):
        """Test successful JWKS fetch."""
        with patch('httpx.Client') as mock_client:
            mock_response = Mock()
            mock_response.json.return_value = mock_jwks
            mock_response.raise_for_status = Mock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response

            jwks = clerk_auth._fetch_jwks()

            assert jwks is not None
            assert len(jwks['keys']) == 1
            assert jwks['keys'][0]['kid'] == 'test-key-id'

    @pytest.mark.asyncio
    async def test_fetch_jwks_retry_logic(self, clerk_auth):
        """Test JWKS fetch retry logic on failure."""
        with patch('httpx.Client') as mock_client:
            http_error = httpx.HTTPError("Network error")
            mock_client.return_value.__enter__.return_value.get.side_effect = [
                http_error,
                http_error,
                Mock(json=lambda: {"keys": []}, raise_for_status=lambda: None)
            ]

            start_time = time.time()
            jwks = clerk_auth._fetch_jwks(retry_count=3, retry_delay=0.1)
            elapsed = time.time() - start_time

            # Should have retried and succeeded on third attempt
            assert jwks is not None
            # Should have delayed between retries
            assert elapsed >= 0.2  # 0.1 + 0.2 (exponential backoff)

    @pytest.mark.asyncio
    async def test_fetch_jwks_caching(self, clerk_auth, mock_jwks):
        """Test JWKS caching mechanism."""
        with patch('httpx.Client') as mock_client:
            mock_response = Mock()
            mock_response.json.return_value = mock_jwks
            mock_response.raise_for_status = Mock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response

            # First fetch
            jwks1 = clerk_auth._fetch_jwks()
            # Second fetch should use cache
            jwks2 = clerk_auth._fetch_jwks()

            assert jwks1 == jwks2
            # Should only call API once due to caching
            assert mock_client.return_value.__enter__.return_value.get.call_count == 1

    @pytest.mark.asyncio
    async def test_verify_token_missing_kid(self, clerk_auth):
        """Test token verification fails with missing kid."""
        token = jwt.encode({"sub": "user_123"}, "secret", algorithm="HS256")

        result = await clerk_auth.verify_token(token)
        assert result is None

    @pytest.mark.asyncio
    async def test_verify_token_expired(self, clerk_auth, rsa_keys, mock_jwks):
        """Test token verification fails with expired token."""
        private_key, _, _ = rsa_keys

        # Create expired token
        expired_token = jwt.encode(
            {
                "sub": "user_123",
                "email": "test@example.com",
                "exp": datetime.utcnow() - timedelta(hours=1),
                "iat": datetime.utcnow() - timedelta(hours=2),
                "iss": clerk_auth.issuer
            },
            private_key,
            algorithm="RS256",
            headers={"kid": "test-key-id"}
        )

        with patch.object(clerk_auth, '_fetch_jwks', return_value=mock_jwks):
            result = await clerk_auth.verify_token(expired_token)
            assert result is None

    @pytest.mark.asyncio
    async def test_verify_token_invalid_issuer(self, clerk_auth, rsa_keys, mock_jwks):
        """Test token verification fails with invalid issuer."""
        private_key, _, _ = rsa_keys

        # Create token with wrong issuer
        token = jwt.encode(
            {
                "sub": "user_123",
                "email": "test@example.com",
                "exp": datetime.utcnow() + timedelta(hours=1),
                "iat": datetime.utcnow(),
                "iss": "https://wrong-issuer.com"
            },
            private_key,
            algorithm="RS256",
            headers={"kid": "test-key-id"}
        )

        with patch.object(clerk_auth, '_fetch_jwks', return_value=mock_jwks):
            result = await clerk_auth.verify_token(token)
            assert result is None

    @pytest.mark.asyncio
    async def test_verify_token_retry_logic(self, clerk_auth, rsa_keys, mock_jwks):
        """Test token verification retry logic."""
        private_key, _, _ = rsa_keys

        token = jwt.encode(
            {
                "sub": "user_123",
                "email": "test@example.com",
                "exp": datetime.utcnow() + timedelta(hours=1),
                "iat": datetime.utcnow(),
                "iss": clerk_auth.issuer
            },
            private_key,
            algorithm="RS256",
            headers={"kid": "test-key-id"}
        )

        with patch.object(clerk_auth, '_fetch_jwks', return_value=mock_jwks):
            with patch('jwt.decode', side_effect=[
                jwt.InvalidTokenError("Temp error"),
                {
                    "sub": "user_123",
                    "email": "test@example.com",
                    "email_verified": True
                }
            ]):
                result = await clerk_auth.verify_token(token, retry_count=2)
                assert result is not None
                assert result['clerk_id'] == 'user_123'


class TestUserResponse:
    """Test UserResponse schema validation."""

    def test_valid_user_response(self, auth_module):
        """Test valid UserResponse creation."""
        UserResponse = auth_module.UserResponse
        user_data = {
            "id": 1,
            "email": "test@example.com",
            "username": "testuser",
            "clerk_id": "user_2xxxxx",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        response = UserResponse(**user_data)
        assert response.email == "test@example.com"
        assert response.id == 1

    def test_invalid_email_format(self, auth_module):
        """Test invalid email format raises error."""
        UserResponse = auth_module.UserResponse

        with pytest.raises(ValidationError):
            UserResponse(
                id=1,
                email="invalid-email",
                username="testuser",
                clerk_id="user_2xxxxx",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

    def test_from_orm_user(self, auth_module):
        """Test UserResponse creation from ORM User model."""
        UserResponse = auth_module.UserResponse

        user = MagicMock()
        user.id = 1
        user.email = "test@example.com"
        user.username = "testuser"
        user.clerk_id = "user_2xxxxx"
        user.is_active = True
        user.created_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        response = UserResponse.model_validate(user)
        assert response.email == user.email
        assert response.clerk_id == user.clerk_id


class TestGetCurrentUser:
    """Test get_current_user() function with various scenarios."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = Mock(spec=Session)
        return db

    @pytest.fixture
    def mock_config_dev(self):
        """Mock development configuration."""
        config = Mock()
        config.environment = "development"
        return config

    @pytest.fixture
    def mock_config_prod(self):
        """Mock production configuration."""
        config = Mock()
        config.environment = "production"
        return config

    @pytest.mark.asyncio
    async def test_dev_bypass_enabled(self, mock_db, mock_config_dev, auth_module):
        """Test DEV_AUTH_BYPASS in development environment."""
        with patch.dict(
            os.environ,
            {
                "ENVIRONMENT": "development",
                "DEV_AUTH_BYPASS": "true",
                "DEV_USER_EMAIL": "dev@localhost",
            }
        ):
            mock_db.query.return_value.filter.return_value.first.return_value = None
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock(side_effect=lambda user: setattr(user, 'id', 1))

            user = await auth_module.get_current_user(None, None, mock_db)

            assert user is not None
            assert user.email == "dev@localhost"

    @pytest.mark.asyncio
    async def test_dev_bypass_disabled(self, mock_db, mock_config_dev, auth_module):
        """Test authentication required when DEV_AUTH_BYPASS disabled."""
        with patch.dict(
            os.environ,
            {
                "ENVIRONMENT": "development",
                "DEV_AUTH_BYPASS": "false",
            }
        ):
            with pytest.raises(HTTPException) as exc_info:
                await auth_module.get_current_user(None, None, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_no_token_provided(self, mock_db, mock_config_prod, auth_module):
        """Test authentication fails with no token."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with pytest.raises(HTTPException) as exc_info:
                await auth_module.get_current_user(None, None, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Could not validate credentials" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_clerk_not_configured(self, mock_db, mock_config_prod, auth_module):
        """Test authentication fails when Clerk not configured."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with patch.object(auth_module, 'clerk_auth') as mock_clerk:
                mock_clerk.clerk_publishable_key = None
                mock_clerk.extract_token_from_header.return_value = "test-token"

                with pytest.raises(HTTPException) as exc_info:
                    await auth_module.get_current_user("Bearer test-token", None, mock_db)

                assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    async def test_invalid_token(self, mock_db, mock_config_prod, auth_module):
        """Test authentication fails with invalid token."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with patch.object(auth_module, 'clerk_auth') as mock_clerk:
                mock_clerk.clerk_publishable_key = "pk_test_xxxxx"
                mock_clerk.extract_token_from_header.return_value = "invalid-token"
                mock_clerk.verify_token = AsyncMock(return_value=None)

                with pytest.raises(HTTPException) as exc_info:
                    await auth_module.get_current_user("Bearer invalid-token", None, mock_db)

                assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_inactive_user(self, mock_db, mock_config_prod, auth_module):
        """Test authentication fails for inactive user."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with patch.object(auth_module, 'clerk_auth') as mock_clerk:
                mock_clerk.clerk_publishable_key = "pk_test_xxxxx"
                mock_clerk.extract_token_from_header.return_value = "valid-token"
                mock_clerk.verify_token = AsyncMock(return_value={
                    "clerk_id": "user_123",
                    "email": "test@example.com"
                })

                inactive_user = MagicMock()
                inactive_user.is_active = False
                mock_clerk.get_or_create_local_user = AsyncMock(return_value=inactive_user)

                with pytest.raises(HTTPException) as exc_info:
                    await auth_module.get_current_user("Bearer valid-token", None, mock_db)

                assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
                assert "inactive" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_successful_authentication(self, mock_db, mock_config_prod, auth_module):
        """Test successful authentication flow."""
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            with patch.object(auth_module, 'clerk_auth') as mock_clerk:
                mock_clerk.clerk_publishable_key = "pk_test_xxxxx"
                mock_clerk.extract_token_from_header.return_value = "valid-token"
                mock_clerk.verify_token = AsyncMock(return_value={
                    "clerk_id": "user_123",
                    "email": "test@example.com"
                })

                active_user = MagicMock()
                active_user.email = "test@example.com"
                active_user.clerk_id = "user_123"
                active_user.is_active = True
                mock_clerk.get_or_create_local_user = AsyncMock(return_value=active_user)

                user = await auth_module.get_current_user("Bearer valid-token", None, mock_db)

                assert user is not None
                assert user.email == "test@example.com"
                assert user.is_active is True


class TestGetCurrentActiveUser:
    """Test get_current_active_user() dependency."""

    @pytest.mark.asyncio
    async def test_active_user(self, auth_module):
        """Test returns active user."""
        active_user = MagicMock()
        active_user.is_active = True

        result = await auth_module.get_current_active_user(active_user)
        assert result == active_user

    @pytest.mark.asyncio
    async def test_inactive_user(self, auth_module):
        """Test raises exception for inactive user."""
        inactive_user = MagicMock()
        inactive_user.is_active = False

        with pytest.raises(HTTPException) as exc_info:
            await auth_module.get_current_active_user(inactive_user)

        assert exc_info.value.status_code == 400
        assert "Inactive user" in exc_info.value.detail


# Coverage helpers
def test_module_imports():
    """Test all required imports are available."""
    from src.config.settings import AuthConfig
    from src.server.auth import UserResponse, get_current_active_user, get_current_user
    from src.server.clerk_auth import ClerkAuthMiddleware

    assert get_current_user is not None
    assert get_current_active_user is not None
    assert UserResponse is not None
    assert ClerkAuthMiddleware is not None
    assert AuthConfig is not None
