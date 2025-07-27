# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import logging
import traceback
from datetime import datetime
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.server.error_responses import ErrorResponse, ErrorDetail, ValidationErrorResponse
from src.server.exceptions import DeerFlowException

logger = logging.getLogger(__name__)

# Determine if we're in production
IS_PRODUCTION = os.getenv("ENV", "development").lower() in ["production", "prod"]

# Generic error messages for production
GENERIC_ERROR_MESSAGES = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    413: "Payload Too Large",
    415: "Unsupported Media Type",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
}

async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with appropriate detail level"""
    
    # Get request ID from request state
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", ""))
    
    # Log the full error details server-side
    logger.error(
        f"HTTP Exception: {exc.status_code} - {exc.detail}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "headers": dict(request.headers),
            "client": request.client.host if request.client else "unknown",
        }
    )
    
    # Prepare response
    if IS_PRODUCTION and exc.status_code >= 500:
        # In production, hide internal server error details
        detail = GENERIC_ERROR_MESSAGES.get(exc.status_code, "An error occurred")
    else:
        # In development or for client errors, show the actual detail
        detail = exc.detail
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": detail,
            "status_code": exc.status_code,
            # Include request ID if available for tracking
            "request_id": request_id,
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with appropriate detail level"""
    
    # Get request ID from request state
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", ""))
    
    # Log validation errors
    logger.warning(
        f"Validation Error: {exc.errors()}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
        }
    )
    
    if IS_PRODUCTION:
        # In production, provide generic validation error
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error in request data",
                "status_code": 422,
                "request_id": request_id,
            }
        )
    else:
        # In development, show detailed validation errors
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "body": exc.body,
                "status_code": 422,
                "request_id": request_id,
            }
        )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    
    # Get request ID from request state
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", ""))
    
    # Log the full traceback server-side
    logger.error(
        f"Unhandled Exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
        }
    )
    
    if IS_PRODUCTION:
        # In production, never expose internal errors
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal Server Error",
                "status_code": 500,
                "request_id": request_id,
            }
        )
    else:
        # In development, show the error details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc().split('\n'),
                "status_code": 500,
                "request_id": request_id,
            }
        )

async def deerflow_exception_handler(request: Request, exc: DeerFlowException):
    """Handle DeerFlow custom exceptions."""
    
    # Get request ID from request state
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", ""))
    
    # Log the error
    logger.error(
        f"DeerFlow Exception: {exc.error_code} - {exc.detail}",
        extra={
            "request_id": request_id,
            "error_code": exc.error_code,
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
            "extra_data": exc.extra_data,
        }
    )
    
    # Create error response
    error_response = ErrorResponse(
        error_code=exc.error_code,
        message=exc.detail,
        request_id=request_id,
        status_code=exc.status_code,
        extra_data=exc.extra_data if not IS_PRODUCTION else None
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(exclude_none=True),
        headers=exc.headers
    )


def setup_error_handlers(app):
    """Setup all error handlers for the FastAPI app"""
    app.add_exception_handler(DeerFlowException, deerflow_exception_handler)
    app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)