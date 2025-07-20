# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from src.database.base import get_db
from src.database.models import Note, User
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/notes", tags=["notes"])


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    source: Optional[str] = None  # youtube, instagram, tiktok, file, etc.
    source_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteStats(BaseModel):
    total_notes: int
    notes_by_source: Dict[str, int]
    recent_sources: List[str]


@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    search: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's notes with optional search and filters."""
    query = db.query(Note).filter(Note.user_id == current_user.id)

    # Search in title, content, transcript, and summary
    if search:
        search_filter = or_(
            Note.title.ilike(f"%{search}%"),
            Note.content.ilike(f"%{search}%"),
            Note.transcript.ilike(f"%{search}%"),
            Note.summary.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    if source:
        query = query.filter(Note.source == source)

    notes = query.order_by(desc(Note.created_at)).offset(offset).limit(limit).all()
    return [NoteResponse.from_orm(note) for note in notes]


@router.get("/stats", response_model=NoteStats)
async def get_notes_stats(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get statistics about user's notes."""
    # Total notes
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()

    # Notes by source
    notes = (
        db.query(Note.source)
        .filter(Note.user_id == current_user.id, Note.source.isnot(None))
        .all()
    )

    notes_by_source = {}
    for (source,) in notes:
        if source:
            notes_by_source[source] = notes_by_source.get(source, 0) + 1

    # Recent unique sources
    recent_sources = (
        db.query(Note.source)
        .filter(Note.user_id == current_user.id, Note.source.isnot(None))
        .distinct()
        .order_by(desc(Note.created_at))
        .limit(10)
        .all()
    )

    recent_sources_list = [source[0] for source in recent_sources if source[0]]

    return NoteStats(
        total_notes=total_notes,
        notes_by_source=notes_by_source,
        recent_sources=recent_sources_list,
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific note."""
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return NoteResponse.from_orm(note)


@router.post("/", response_model=NoteResponse)
async def create_note(
    note: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new note."""
    db_note = Note(user_id=current_user.id, **note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return NoteResponse.from_orm(db_note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a note."""
    db_note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Update fields
    update_data = note_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)

    db.commit()
    db.refresh(db_note)
    return NoteResponse.from_orm(db_note)


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a note."""
    db_note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}


@router.post("/extract")
async def extract_content(
    url: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Extract content from a URL (YouTube, Instagram, TikTok, etc)."""
    # This is a placeholder for content extraction logic
    # In a real implementation, you would:
    # 1. Detect the source from URL
    # 2. Use appropriate API/scraper to extract content
    # 3. Generate transcript if it's a video
    # 4. Generate summary using LLM

    # For now, return a mock response
    source = "unknown"
    if "youtube.com" in url or "youtu.be" in url:
        source = "youtube"
    elif "instagram.com" in url:
        source = "instagram"
    elif "tiktok.com" in url:
        source = "tiktok"

    return {
        "source": source,
        "title": f"Content from {source}",
        "source_url": url,
        "transcript": "This would be the extracted transcript...",
        "summary": "This would be an AI-generated summary...",
        "metadata": {
            "duration": "5:30",
            "author": "Unknown",
            "extracted_at": datetime.utcnow().isoformat(),
        },
    }


@router.post("/summarize/{note_id}")
async def summarize_note(
    note_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate or regenerate summary for a note."""
    db_note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    # This is a placeholder for summary generation
    # In a real implementation, you would use an LLM to generate summary
    # based on the note's content and/or transcript

    content_to_summarize = db_note.transcript or db_note.content or ""

    if not content_to_summarize:
        raise HTTPException(status_code=400, detail="No content available to summarize")

    # Mock summary generation
    summary = f"Summary of '{db_note.title}': This is a placeholder summary that would be generated by an AI model based on the note's content."

    db_note.summary = summary
    db.commit()
    db.refresh(db_note)

    return {"note_id": note_id, "summary": summary}
