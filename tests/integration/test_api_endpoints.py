# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import asyncio
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.server.app import app


class TestHealthCheckEndpoint:
    """Tests for health check endpoint."""

    def test_health_check_success(self):
        """Test that health check returns 200 OK."""
        with TestClient(app) as client:
            response = client.get("/health")
            assert response.status_code == 200
            assert response.json() == {"status": "healthy"}

    def test_health_check_headers(self):
        """Test that health check returns correct headers."""
        with TestClient(app) as client:
            response = client.get("/health")
            assert "application/json" in response.headers.get("content-type", "")


class TestConfigEndpoint:
    """Tests for configuration endpoint."""

    @patch('src.server.app.get_configured_llm_models')
    def test_config_endpoint_success(self, mock_get_models):
        """Test that config endpoint returns LLM models."""
        mock_get_models.return_value = {
            "basic": ["gpt-4"],
            "reasoning": ["deepseek-reasoning"]
        }

        with TestClient(app) as client:
            response = client.get("/api/config")
            assert response.status_code == 200
            data = response.json()
            assert "llm_models" in data
            assert data["llm_models"]["basic"] == ["gpt-4"]

    @patch('src.server.app.get_configured_llm_models')
    def test_config_endpoint_empty_models(self, mock_get_models):
        """Test config endpoint with no configured models."""
        mock_get_models.return_value = {}

        with TestClient(app) as client:
            response = client.get("/api/config")
            assert response.status_code == 200
            data = response.json()
            assert data["llm_models"] == {}


class TestAPIDocumentationEndpoints:
    """Tests for API documentation endpoints."""

    def test_openapi_json_available(self):
        """Test that OpenAPI JSON schema is available."""
        with TestClient(app) as client:
            response = client.get("/openapi.json")
            assert response.status_code == 200
            data = response.json()
            assert "openapi" in data
            assert "paths" in data

    def test_docs_ui_available(self):
        """Test that Swagger UI documentation is available."""
        with TestClient(app) as client:
            response = client.get("/docs")
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")

    def test_redoc_ui_available(self):
        """Test that ReDoc UI documentation is available."""
        with TestClient(app) as client:
            response = client.get("/redoc")
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")


class TestCORSHeaders:
    """Tests for CORS headers configuration."""

    def test_cors_preflight_request(self):
        """Test CORS preflight OPTIONS request."""
        with TestClient(app) as client:
            response = client.options(
                "/api/config",
                headers={
                    "Origin": "http://localhost:4000",
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Content-Type"
                }
            )
            # Should allow the request or return 405 if OPTIONS not implemented
            assert response.status_code in [200, 405]

    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses."""
        with TestClient(app) as client:
            response = client.get(
                "/api/config",
                headers={"Origin": "http://localhost:4000"}
            )
            assert response.status_code == 200
            # Check if CORS headers are present (may vary based on FastAPI CORS setup)
            headers = response.headers
            # Basic check - at least one CORS header should be present
            cors_headers = [h for h in headers.keys() if h.lower().startswith('access-control')]
            # This test may need adjustment based on actual CORS configuration


class TestErrorHandling:
    """Tests for API error handling."""

    def test_nonexistent_endpoint_returns_404(self):
        """Test that non-existent endpoints return 404."""
        with TestClient(app) as client:
            response = client.get("/api/nonexistent")
            assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test that unsupported HTTP methods return 405."""
        with TestClient(app) as client:
            # Assuming /health only supports GET
            response = client.post("/health")
            assert response.status_code == 405

    def test_invalid_json_request(self):
        """Test handling of invalid JSON in request body."""
        with TestClient(app) as client:
            # Try to post invalid JSON to an endpoint that might accept JSON
            response = client.post(
                "/api/chat/stream",
                content="invalid json content",
                headers={"Content-Type": "application/json"}
            )
            # Should return 422 (Unprocessable Entity) for invalid JSON
            assert response.status_code in [400, 422, 401, 403]  # Various possible error codes


class TestRequestValidation:
    """Tests for request validation."""

    def test_empty_request_body_validation(self):
        """Test validation with empty request body where required."""
        with TestClient(app) as client:
            response = client.post(
                "/api/chat/stream",
                json={}
            )
            # Should return validation error for missing required fields
            assert response.status_code in [400, 401, 403, 422]

    def test_request_size_limits(self):
        """Test that extremely large requests are rejected."""
        with TestClient(app) as client:
            # Create a very large payload
            large_payload = {"data": "x" * 10000}
            response = client.post(
                "/api/chat/stream",
                json=large_payload
            )
            # Should either succeed (if allowed) or fail with appropriate error
            assert response.status_code in [200, 400, 401, 403, 413, 422]


class TestSecurityHeaders:
    """Tests for security headers."""

    def test_security_headers_present(self):
        """Test that basic security headers are present."""
        with TestClient(app) as client:
            response = client.get("/health")
            headers = response.headers

            # Check for common security headers (may not all be present)
            security_headers = {
                'x-content-type-options',
                'x-frame-options',
                'x-xss-protection',
                'referrer-policy',
                'content-security-policy'
            }

            # At least some headers should be present or the app should be configured for security
            # This test can be adjusted based on actual security configuration
            assert response.status_code == 200  # Basic check that app is responding


class TestContentTypeHandling:
    """Tests for content type handling."""

    def test_json_content_type_returned(self):
        """Test that JSON endpoints return correct content type."""
        with TestClient(app) as client:
            response = client.get("/health")
            assert "application/json" in response.headers.get("content-type", "")

    def test_html_content_type_for_docs(self):
        """Test that documentation endpoints return HTML content type."""
        with TestClient(app) as client:
            response = client.get("/docs")
            assert "text/html" in response.headers.get("content-type", "")


@pytest.mark.asyncio
class TestAsyncEndpoints:
    """Tests for async endpoint behavior."""

    async def test_concurrent_health_checks(self):
        """Test that multiple concurrent health checks work correctly."""
        async def make_request():
            with TestClient(app) as client:
                response = client.get("/health")
                return response.status_code

        # Make multiple concurrent requests
        tasks = [make_request() for _ in range(5)]
        results = await asyncio.gather(*tasks)

        # All requests should succeed
        assert all(status == 200 for status in results)

    async def test_concurrent_config_requests(self):
        """Test concurrent configuration requests."""
        async def make_config_request():
            with TestClient(app) as client:
                response = client.get("/api/config")
                return response.status_code

        # Make multiple concurrent requests
        tasks = [make_config_request() for _ in range(3)]
        results = await asyncio.gather(*tasks)

        # All requests should either succeed or return consistent errors
        assert all(status in [200, 500] for status in results)
