# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Tests for unified API schemas.

Tests serialization, deserialization, validation, and OpenAPI documentation
for all API schemas defined in src/server/schemas.py.
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from src.server.schemas import (
    UserResponse,
    UserCreateRequest,
    UserUpdateRequest,
)


class TestUserResponseSchema:
    """Test UserResponse schema serialization and validation."""

    def test_valid_user_response(self):
        """Test creating a valid UserResponse."""
        user_data = {
            "id": 1,
            "email": "test@example.com",
            "username": "testuser",
            "clerk_id": "user_2abc123xyz",
            "is_active": True,
            "created_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
        }

        user = UserResponse(**user_data)

        assert user.id == 1
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.clerk_id == "user_2abc123xyz"
        assert user.is_active is True
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_user_response_serialization(self):
        """Test UserResponse serialization to JSON."""
        user_data = {
            "id": 1,
            "email": "test@example.com",
            "username": "testuser",
            "clerk_id": "user_2abc123xyz",
            "is_active": True,
            "created_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
        }

        user = UserResponse(**user_data)
        json_data = user.model_dump(mode="json")

        assert json_data["id"] == 1
        assert json_data["email"] == "test@example.com"
        assert json_data["username"] == "testuser"
        assert json_data["clerk_id"] == "user_2abc123xyz"
        assert json_data["is_active"] is True
        assert "created_at" in json_data
        assert "updated_at" in json_data

    def test_user_response_json_schema(self):
        """Test UserResponse JSON schema generation for OpenAPI."""
        schema = UserResponse.model_json_schema()

        assert "properties" in schema
        assert "id" in schema["properties"]
        assert "email" in schema["properties"]
        assert "username" in schema["properties"]
        assert "clerk_id" in schema["properties"]
        assert "is_active" in schema["properties"]
        assert "created_at" in schema["properties"]
        assert "updated_at" in schema["properties"]

        # Check descriptions are present
        assert "description" in schema["properties"]["id"]
        assert "description" in schema["properties"]["email"]
        assert "description" in schema["properties"]["username"]

        # Check examples are present
        assert "examples" in schema["properties"]["id"]
        assert "examples" in schema["properties"]["email"]

    def test_user_response_invalid_email(self):
        """Test UserResponse with invalid email."""
        user_data = {
            "id": 1,
            "email": "invalid-email",  # Invalid email format
            "username": "testuser",
            "clerk_id": "user_2abc123xyz",
            "is_active": True,
            "created_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
        }

        with pytest.raises(ValidationError) as exc_info:
            UserResponse(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("email",) for error in errors)

    def test_user_response_missing_required_fields(self):
        """Test UserResponse with missing required fields."""
        incomplete_data = {
            "id": 1,
            "email": "test@example.com",
            # Missing username, clerk_id, created_at, updated_at
        }

        with pytest.raises(ValidationError) as exc_info:
            UserResponse(**incomplete_data)

        errors = exc_info.value.errors()
        assert len(errors) >= 4  # At least 4 missing fields

    def test_user_response_datetime_parsing(self):
        """Test UserResponse datetime string parsing."""
        user_data = {
            "id": 1,
            "email": "test@example.com",
            "username": "testuser",
            "clerk_id": "user_2abc123xyz",
            "is_active": True,
            "created_at": "2025-01-15T10:30:00Z",  # ISO string
            "updated_at": "2025-01-15T10:30:00+00:00",  # ISO string with timezone
        }

        user = UserResponse(**user_data)

        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)


class TestUserCreateRequestSchema:
    """Test UserCreateRequest schema validation."""

    def test_valid_user_create_request(self):
        """Test creating a valid UserCreateRequest."""
        create_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "clerk_id": "user_2xyz789abc",
        }

        request = UserCreateRequest(**create_data)

        assert request.email == "newuser@example.com"
        assert request.username == "newuser"
        assert request.clerk_id == "user_2xyz789abc"

    def test_user_create_request_invalid_email(self):
        """Test UserCreateRequest with invalid email."""
        create_data = {
            "email": "not-an-email",
            "username": "newuser",
            "clerk_id": "user_2xyz789abc",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**create_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("email",) for error in errors)

    def test_user_create_request_short_username(self):
        """Test UserCreateRequest with username too short."""
        create_data = {
            "email": "newuser@example.com",
            "username": "ab",  # Only 2 chars, minimum is 3
            "clerk_id": "user_2xyz789abc",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**create_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("username",) for error in errors)

    def test_user_create_request_json_schema(self):
        """Test UserCreateRequest JSON schema for OpenAPI."""
        schema = UserCreateRequest.model_json_schema()

        assert "properties" in schema
        assert "email" in schema["properties"]
        assert "username" in schema["properties"]
        assert "clerk_id" in schema["properties"]

        # Check required fields
        assert "required" in schema
        assert "email" in schema["required"]
        assert "username" in schema["required"]
        assert "clerk_id" in schema["required"]


class TestUserUpdateRequestSchema:
    """Test UserUpdateRequest schema validation."""

    def test_valid_user_update_request(self):
        """Test creating a valid UserUpdateRequest."""
        update_data = {
            "email": "updated@example.com",
            "username": "updateduser",
            "is_active": False,
        }

        request = UserUpdateRequest(**update_data)

        assert request.email == "updated@example.com"
        assert request.username == "updateduser"
        assert request.is_active is False

    def test_user_update_request_partial(self):
        """Test UserUpdateRequest with partial data (all fields optional)."""
        update_data = {"email": "updated@example.com"}

        request = UserUpdateRequest(**update_data)

        assert request.email == "updated@example.com"
        assert request.username is None
        assert request.is_active is None

    def test_user_update_request_empty(self):
        """Test UserUpdateRequest with no fields (all optional)."""
        update_data = {}

        request = UserUpdateRequest(**update_data)

        assert request.email is None
        assert request.username is None
        assert request.is_active is None

    def test_user_update_request_invalid_email(self):
        """Test UserUpdateRequest with invalid email."""
        update_data = {"email": "invalid-email"}

        with pytest.raises(ValidationError) as exc_info:
            UserUpdateRequest(**update_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("email",) for error in errors)

    def test_user_update_request_json_schema(self):
        """Test UserUpdateRequest JSON schema for OpenAPI."""
        schema = UserUpdateRequest.model_json_schema()

        assert "properties" in schema
        assert "email" in schema["properties"]
        assert "username" in schema["properties"]
        assert "is_active" in schema["properties"]

        # All fields should be optional
        assert "required" not in schema or len(schema.get("required", [])) == 0


class TestSchemaIntegration:
    """Test schema integration and consistency."""

    def test_orm_mode_enabled(self):
        """Test that ORM mode is enabled for database model integration."""
        # Check Config class has from_attributes enabled
        assert hasattr(UserResponse.model_config, "from_attributes") or UserResponse.model_config.get("from_attributes", False)

    def test_all_schemas_exportable(self):
        """Test that all schemas are properly exported."""
        from src.server.schemas import __all__

        assert "UserResponse" in __all__
        assert "UserCreateRequest" in __all__
        assert "UserUpdateRequest" in __all__

    def test_schema_consistency(self):
        """Test that schemas have consistent field naming and types."""
        user_response_schema = UserResponse.model_json_schema()
        user_create_schema = UserCreateRequest.model_json_schema()
        user_update_schema = UserUpdateRequest.model_json_schema()

        # Email field should have same type across all schemas (considering Optional fields)
        assert user_response_schema["properties"]["email"]["type"] == "string"
        assert user_create_schema["properties"]["email"]["type"] == "string"
        # UserUpdate has optional fields, so it may use anyOf structure
        email_update_prop = user_update_schema["properties"]["email"]
        assert "type" in email_update_prop or "anyOf" in email_update_prop

        # Username field should have same type across all schemas
        assert user_response_schema["properties"]["username"]["type"] == "string"
        assert user_create_schema["properties"]["username"]["type"] == "string"
        username_update_prop = user_update_schema["properties"]["username"]
        assert "type" in username_update_prop or "anyOf" in username_update_prop


class TestOpenAPIDocumentation:
    """Test OpenAPI documentation generation."""

    def test_user_response_openapi_example(self):
        """Test that UserResponse includes OpenAPI example."""
        schema = UserResponse.model_json_schema()

        # Check that json_schema_extra example is included
        examples = schema.get("examples", [])
        assert len(examples) > 0 or "example" in schema

    def test_field_descriptions_present(self):
        """Test that all fields have descriptions for OpenAPI docs."""
        schema = UserResponse.model_json_schema()

        # All fields should have descriptions
        for field_name in ["id", "email", "username", "clerk_id", "is_active", "created_at", "updated_at"]:
            assert "description" in schema["properties"][field_name], f"Field {field_name} missing description"

    def test_field_examples_present(self):
        """Test that fields have examples for better API documentation."""
        schema = UserResponse.model_json_schema()

        # Key fields should have examples
        for field_name in ["id", "email", "username", "clerk_id"]:
            assert "examples" in schema["properties"][field_name], f"Field {field_name} missing examples"
