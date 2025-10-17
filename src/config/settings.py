# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Centralized configuration management using Pydantic BaseSettings.
All environment variables are loaded and validated here.
"""

import os
from typing import Optional, List
from pydantic import (
    BaseModel,
    Field,
    validator,
    field_validator,
    model_validator,
    ConfigDict,
)
from pydantic_settings import BaseSettings


class DatabaseConfig(BaseModel):
    """Database configuration for PostgreSQL/Neon"""

    url: str = Field(
        ...,
        description="PostgreSQL connection URL with SSL",
        examples=["postgresql://username:password@hostname/database?sslmode=require"]
    )
    pool_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Database connection pool size"
    )
    max_overflow: int = Field(
        default=10,
        ge=0,
        le=50,
        description="Maximum overflow connections"
    )
    pool_timeout: int = Field(
        default=30,
        ge=1,
        le=300,
        description="Connection pool timeout in seconds"
    )
    pool_recycle: int = Field(
        default=3600,
        ge=300,
        le=7200,
        description="Connection recycle time in seconds"
    )

    @field_validator('url')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format and SSL mode"""
        if not v:
            raise ValueError("Database URL cannot be empty")

        # Check for PostgreSQL protocol
        if not v.startswith(('postgresql://', 'postgres://')):
            raise ValueError("Database URL must start with postgresql:// or postgres://")

        # Security: Enforce SSL in production
        environment = os.getenv('ENVIRONMENT', 'production')
        if environment == 'production' and 'sslmode' not in v:
            raise ValueError("Production database URL must include sslmode parameter")

        return v

    model_config = ConfigDict(validate_assignment=True)


class RedisConfig(BaseModel):
    """Redis cache configuration"""

    url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    max_connections: int = Field(
        default=50,
        ge=1,
        le=200,
        description="Maximum Redis connection pool size"
    )
    socket_timeout: int = Field(
        default=5,
        ge=1,
        le=30,
        description="Socket timeout in seconds"
    )
    socket_connect_timeout: int = Field(
        default=5,
        ge=1,
        le=30,
        description="Socket connect timeout in seconds"
    )
    decode_responses: bool = Field(
        default=True,
        description="Decode Redis responses to strings"
    )

    @field_validator('url')
    @classmethod
    def validate_redis_url(cls, v: str) -> str:
        """Validate Redis URL format"""
        if not v.startswith(('redis://', 'rediss://')):
            raise ValueError("Redis URL must start with redis:// or rediss://")
        return v

    model_config = ConfigDict(validate_assignment=True)


class AuthConfig(BaseModel):
    """Authentication and security configuration"""

    environment: str = Field(
        default="production",
        description="Application environment (inherited from AppConfig)"
    )
    jwt_secret_key: str = Field(
        ...,
        description="JWT secret key (minimum 32 characters)"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    access_token_expire_minutes: int = Field(
        default=30,
        ge=5,
        le=1440,
        description="Access token expiration time in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Refresh token expiration time in days"
    )
    cors_allowed_origins: List[str] = Field(
        default=["http://localhost:4000", "http://localhost:3000"],
        description="List of allowed CORS origins"
    )

    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value"""
        allowed = ['development', 'production', 'staging', 'test']
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of: {', '.join(allowed)}")
        return v

    @field_validator('jwt_secret_key')
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        """Validate JWT secret key strength"""
        # Get environment from context
        environment = info.data.get('environment', 'production')

        # Security: Warn about weak secrets
        weak_keys = [
            'your-secure-random-key-here',
            'changeme',
            'secret',
            '123456',
            'dev-secret-key',
            'test-secret-key'
        ]
        normalized_secret = v.lower()
        simplified = normalized_secret.replace("-", "").replace("_", "")
        for weak in weak_keys:
            weak_norm = weak.lower()
            weak_simplified = weak_norm.replace("-", "").replace("_", "")

            patterns = [
                normalized_secret == weak_norm,
                normalized_secret.startswith(f"{weak_norm}-"),
                normalized_secret.startswith(f"{weak_norm}_"),
                normalized_secret.endswith(f"-{weak_norm}"),
                normalized_secret.endswith(f"_{weak_norm}"),
                simplified == weak_simplified,
                simplified.startswith(weak_simplified),
                simplified.endswith(weak_simplified),
            ]

            if any(patterns):
                if environment == 'production':
                    raise ValueError(
                        "JWT_SECRET_KEY is using a default/weak value in production. "
                        "Generate a secure key with: openssl rand -hex 32"
                    )
                # Just warn in development (or other non-production)
                import warnings

                warnings.warn(
                    f"JWT_SECRET_KEY is using a weak value in {environment} environment. "
                    "This is acceptable for development but NEVER use in production."
                )
                return v

        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")

        return v

    @field_validator('cors_allowed_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """Parse CORS origins from comma-separated string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @model_validator(mode='after')
    def validate_production_settings(self) -> 'AuthConfig':
        """Validate security settings for production environment"""
        if self.environment == 'production':
            # Ensure no localhost origins in production
            for origin in self.cors_allowed_origins:
                if 'localhost' in origin or '127.0.0.1' in origin:
                    raise ValueError(
                        f"CORS origin '{origin}' contains localhost/127.0.0.1 in production. "
                        f"Update CORS_ALLOWED_ORIGINS environment variable."
                    )
        return self

    model_config = ConfigDict(validate_assignment=True)


class ClerkConfig(BaseModel):
    """Clerk authentication configuration"""

    publishable_key: Optional[str] = Field(
        default=None,
        description="Clerk publishable key"
    )
    secret_key: Optional[str] = Field(
        default=None,
        description="Clerk secret key"
    )

    model_config = ConfigDict(validate_assignment=True)




class LLMConfig(BaseModel):
    """LLM API configuration"""

    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    google_api_key: Optional[str] = Field(default=None, description="Google API key")

    model_config = ConfigDict(validate_assignment=True)


class SearchConfig(BaseModel):
    """Search engine API configuration"""

    tavily_api_key: Optional[str] = Field(default=None, description="Tavily API key")
    brave_search_api_key: Optional[str] = Field(default=None, description="Brave Search API key")
    firecrawl_api_key: Optional[str] = Field(default=None, description="Firecrawl API key")

    model_config = ConfigDict(validate_assignment=True)


class RAGConfig(BaseModel):
    """RAG (Retrieval-Augmented Generation) configuration"""

    ragflow_api_url: Optional[str] = Field(default=None, description="RAGFlow API URL")
    ragflow_api_key: Optional[str] = Field(default=None, description="RAGFlow API key")

    model_config = ConfigDict(validate_assignment=True)


class ObservabilityConfig(BaseModel):
    """Observability and monitoring configuration"""

    langchain_tracing_v2: bool = Field(default=False, description="Enable LangSmith tracing")
    langsmith_api_key: Optional[str] = Field(default=None, description="LangSmith API key")

    model_config = ConfigDict(validate_assignment=True)


class AppConfig(BaseSettings):
    """Main application configuration with all sub-configs"""

    # Environment
    environment: str = Field(
        default="development",
        description="Application environment (development/production)"
    )

    # Application settings
    app_name: str = Field(default="DeerFlow", description="Application name")
    app_version: str = Field(default="0.1.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")

    # Server settings
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8005, ge=1, le=65535, description="Server port")

    # Required configurations
    database: DatabaseConfig
    auth: AuthConfig

    # Optional configurations
    redis: Optional[RedisConfig] = None
    clerk: Optional[ClerkConfig] = None
    llm: Optional[LLMConfig] = None
    search: Optional[SearchConfig] = None
    rag: Optional[RAGConfig] = None
    observability: Optional[ObservabilityConfig] = None

    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value"""
        allowed = ['development', 'production', 'staging', 'test']
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of: {', '.join(allowed)}")
        return v

    @model_validator(mode='after')
    def validate_cors_for_environment(self) -> 'AppConfig':
        """Validate CORS origins against environment after all fields are set"""
        if self.environment == 'production':
            for origin in self.auth.cors_allowed_origins:
                if 'localhost' in origin or '127.0.0.1' in origin:
                    raise ValueError(
                        f"CORS origin '{origin}' contains localhost/127.0.0.1 in production environment. "
                        f"Update CORS_ALLOWED_ORIGINS environment variable."
                    )
        return self

    model_config = ConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        env_nested_delimiter='__',
        case_sensitive=False,
        validate_assignment=True,
        extra='ignore'  # Ignore extra environment variables
    )


def load_config() -> AppConfig:
    """
    Load and validate application configuration.

    This function performs early validation of all configuration parameters
    and raises descriptive errors if any required values are missing or invalid.

    Returns:
        AppConfig: Validated application configuration

    Raises:
        ValueError: If any configuration value is invalid
        ValidationError: If required configuration is missing
    """
    from pydantic import ValidationError

    try:
        # Build database config
        database_config = DatabaseConfig(
            url=os.getenv('DATABASE_URL', ''),
            pool_size=int(os.getenv('DB_POOL_SIZE', '20')),
            max_overflow=int(os.getenv('DB_MAX_OVERFLOW', '10')),
            pool_timeout=int(os.getenv('DB_POOL_TIMEOUT', '30')),
            pool_recycle=int(os.getenv('DB_POOL_RECYCLE', '3600'))
        )

        # Get environment early for AuthConfig validation
        environment = os.getenv('ENVIRONMENT', 'development')

        # Build auth config
        auth_config = AuthConfig(
            environment=environment,
            jwt_secret_key=os.getenv('JWT_SECRET_KEY', ''),
            jwt_algorithm=os.getenv('JWT_ALGORITHM', 'HS256'),
            access_token_expire_minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30')),
            refresh_token_expire_days=int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7')),
            cors_allowed_origins=os.getenv(
                'CORS_ALLOWED_ORIGINS',
                'http://localhost:4000,http://localhost:3000'
            )
        )

        # Build optional Redis config
        redis_config = None
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            redis_config = RedisConfig(
                url=redis_url,
                max_connections=int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
                socket_timeout=int(os.getenv('REDIS_SOCKET_TIMEOUT', '5')),
                socket_connect_timeout=int(os.getenv('REDIS_SOCKET_CONNECT_TIMEOUT', '5')),
                decode_responses=os.getenv('REDIS_DECODE_RESPONSES', 'true').lower() == 'true'
            )

        # Build optional Clerk config
        clerk_config = None
        clerk_publishable = os.getenv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
        clerk_secret = os.getenv('CLERK_SECRET_KEY')
        if clerk_publishable or clerk_secret:
            clerk_config = ClerkConfig(
                publishable_key=clerk_publishable,
                secret_key=clerk_secret
            )


        # Build optional LLM config
        llm_config = LLMConfig(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            anthropic_api_key=os.getenv('ANTHROPIC_API_KEY'),
            google_api_key=os.getenv('GOOGLE_API_KEY')
        )

        # Build optional Search config
        search_config = SearchConfig(
            tavily_api_key=os.getenv('TAVILY_API_KEY'),
            brave_search_api_key=os.getenv('BRAVE_SEARCH_API_KEY'),
            firecrawl_api_key=os.getenv('FIRECRAWL_API_KEY')
        )

        # Build optional RAG config
        rag_config = RAGConfig(
            ragflow_api_url=os.getenv('RAGFLOW_API_URL'),
            ragflow_api_key=os.getenv('RAGFLOW_API_KEY')
        )

        # Build optional Observability config
        observability_config = ObservabilityConfig(
            langchain_tracing_v2=os.getenv('LANGCHAIN_TRACING_V2', 'false').lower() == 'true',
            langsmith_api_key=os.getenv('LANGSMITH_API_KEY')
        )

        # Build main app config
        config = AppConfig(
            environment=environment,
            app_name=os.getenv('APP_NAME', 'DeerFlow'),
            app_version=os.getenv('APP_VERSION', '0.1.0'),
            debug=os.getenv('DEBUG', 'false').lower() == 'true',
            host=os.getenv('HOST', '0.0.0.0'),
            port=int(os.getenv('PORT', '8005')),
            database=database_config,
            auth=auth_config,
            redis=redis_config,
            clerk=clerk_config,
            llm=llm_config,
            search=search_config,
            rag=rag_config,
            observability=observability_config
        )

        return config

    except ValidationError as e:
        # Format validation errors for better readability
        error_messages = []
        for error in e.errors():
            field = ' -> '.join(str(loc) for loc in error['loc'])
            message = error['msg']
            error_messages.append(f"  • {field}: {message}")

        raise ValueError(
            "Configuration validation failed:\n" + "\n".join(error_messages)
        ) from e
    except Exception as e:
        raise ValueError(f"Failed to load configuration: {str(e)}") from e


# Global config instance (lazy loaded)
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """
    Get the global configuration instance.

    Returns:
        AppConfig: The application configuration
    """
    global _config
    if _config is None:
        _config = load_config()
    return _config


__all__ = [
    'AppConfig',
    'DatabaseConfig',
    'RedisConfig',
    'AuthConfig',
    'ClerkConfig',
    'LLMConfig',
    'SearchConfig',
    'RAGConfig',
    'ObservabilityConfig',
    'load_config',
    'get_config',
]
