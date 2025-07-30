# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import TypeVar, Generic, List, Optional, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query
import math

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination parameters for API requests"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def skip(self) -> int:
        """Calculate the number of items to skip"""
        return (self.page - 1) * self.per_page
    
    @property
    def limit(self) -> int:
        """Get the limit for the query"""
        return self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model"""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool
    
    class Config:
        from_attributes = True


def paginate(
    query: Query,
    page: int = 1,
    per_page: int = 20,
    error_out: bool = True
) -> tuple[List[Any], dict]:
    """
    Paginate a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        page: Page number (1-indexed)
        per_page: Number of items per page
        error_out: Whether to raise an error for invalid page numbers
        
    Returns:
        Tuple of (items, pagination_info)
    """
    if page < 1:
        if error_out:
            raise ValueError("Page number must be positive")
        page = 1
    
    if per_page < 1:
        if error_out:
            raise ValueError("Per page must be positive")
        per_page = 20
    
    # Get total count
    total = query.count()
    
    # Calculate pagination values
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    # Validate page number
    if page > pages and error_out and total > 0:
        raise ValueError(f"Page {page} is out of range. Max page is {pages}")
    
    # Get items for current page
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    
    pagination_info = {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1
    }
    
    return items, pagination_info


def create_paginated_response(
    items: List[Any],
    pagination_info: dict,
    response_model: Any
) -> dict:
    """
    Create a paginated response with properly serialized items.
    
    Args:
        items: List of database models
        pagination_info: Pagination metadata
        response_model: Pydantic model for serialization
        
    Returns:
        Dictionary ready for JSON response
    """
    serialized_items = [
        response_model.from_orm(item) if hasattr(response_model, 'from_orm') else response_model(**item.__dict__)
        for item in items
    ]
    
    return {
        "items": serialized_items,
        **pagination_info
    }