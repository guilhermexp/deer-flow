# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.database.base import get_db
from src.database.models import Conversation, User
from src.server.auth import get_current_active_user
from src.server.pagination import PaginationParams, PaginatedResponse, paginate, create_paginated_response
from src.server.cache import cache, cached

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class ConversationCreate(BaseModel):
    thread_id: str
    title: Optional[str] = None
    query: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    summary: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    query: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    thread_id: str
    title: Optional[str] = None
    query: Optional[str] = None
    messages: List[Dict[str, Any]]
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=PaginatedResponse[ConversationResponse])
async def get_conversations(
    search: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's conversations with optional search and pagination."""
    # Build base query
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)

    if search:
        query = query.filter(
            Conversation.title.ilike(f"%{search}%")
            | Conversation.query.ilike(f"%{search}%")
            | Conversation.summary.ilike(f"%{search}%")
        )

    # Order by updated_at
    query = query.order_by(desc(Conversation.updated_at))
    
    # Paginate
    items, pagination_info = paginate(
        query,
        page=pagination.page,
        per_page=pagination.per_page
    )
    
    return create_paginated_response(items, pagination_info, ConversationResponse)


@router.get("/{thread_id}", response_model=ConversationResponse)
@cached(prefix="conversation", ttl=300)  # Cache for 5 minutes
async def get_conversation(
    thread_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific conversation by thread ID."""
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.thread_id == thread_id, Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationResponse.from_orm(conversation).dict()


@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new conversation."""
    # Check if conversation already exists
    existing = (
        db.query(Conversation)
        .filter(
            Conversation.thread_id == conversation.thread_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Conversation with this thread_id already exists"
        )

    db_conversation = Conversation(user_id=current_user.id, **conversation.dict())
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return ConversationResponse.from_orm(db_conversation)


@router.put("/{thread_id}", response_model=ConversationResponse)
async def update_conversation(
    thread_id: str,
    conversation_update: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a conversation."""
    db_conversation = (
        db.query(Conversation)
        .filter(
            Conversation.thread_id == thread_id, Conversation.user_id == current_user.id
        )
        .first()
    )

    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Update fields
    update_data = conversation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_conversation, field, value)

    # Update the updated_at timestamp
    db_conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_conversation)
    return ConversationResponse.from_orm(db_conversation)


@router.delete("/{thread_id}")
async def delete_conversation(
    thread_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation."""
    db_conversation = (
        db.query(Conversation)
        .filter(
            Conversation.thread_id == thread_id, Conversation.user_id == current_user.id
        )
        .first()
    )

    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(db_conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}


@router.post("/{thread_id}/messages")
async def add_messages(
    thread_id: str,
    messages: List[Dict[str, Any]],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add messages to an existing conversation."""
    db_conversation = (
        db.query(Conversation)
        .filter(
            Conversation.thread_id == thread_id, Conversation.user_id == current_user.id
        )
        .first()
    )

    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Append new messages
    current_messages = db_conversation.messages or []
    current_messages.extend(messages)

    # Limit to last 200 messages
    if len(current_messages) > 200:
        current_messages = current_messages[-200:]

    db_conversation.messages = current_messages
    db_conversation.updated_at = datetime.utcnow()

    db.commit()

    return {"thread_id": thread_id, "message_count": len(db_conversation.messages)}
