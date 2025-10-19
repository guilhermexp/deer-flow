# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from src.database.base import get_db
from src.database.models import Reminder, TaskPriority, User
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


class ReminderCreate(BaseModel):
    title: str
    time: str  # HH:MM format
    date: datetime | None = None
    priority: TaskPriority | None = TaskPriority.MEDIUM
    category: str | None = None


class ReminderUpdate(BaseModel):
    title: str | None = None
    time: str | None = None
    date: datetime | None = None
    priority: TaskPriority | None = None
    category: str | None = None
    is_completed: bool | None = None


class ReminderResponse(BaseModel):
    id: int
    title: str
    time: str
    date: datetime | None = None
    priority: TaskPriority
    category: str | None = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/today", response_model=list[ReminderResponse])
async def get_today_reminders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get today's reminders."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.date >= today_start,
            Reminder.date < today_end,
            Reminder.is_completed == False,
        )
        .order_by(Reminder.date)
        .all()
    )
    return [ReminderResponse.from_orm(reminder) for reminder in reminders]


@router.get("/", response_model=list[ReminderResponse])
async def get_reminders(
    date: datetime | None = None,
    priority: TaskPriority | None = None,
    category: str | None = None,
    is_completed: bool | None = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's reminders with optional filters."""
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)

    if date:
        # Get reminders for specific date
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        query = query.filter(
            and_(Reminder.date >= start_of_day, Reminder.date < end_of_day)
        )
    if priority:
        query = query.filter(Reminder.priority == priority)
    if category:
        query = query.filter(Reminder.category == category)
    if is_completed is not None:
        query = query.filter(Reminder.is_completed == is_completed)

    reminders = query.order_by(desc(Reminder.date)).offset(offset).limit(limit).all()
    return [ReminderResponse.from_orm(reminder) for reminder in reminders]


@router.post("/", response_model=ReminderResponse)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new reminder."""
    db_reminder = Reminder(user_id=current_user.id, **reminder.dict())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return ReminderResponse.from_orm(db_reminder)


@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a reminder."""
    db_reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )

    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # Update fields
    update_data = reminder_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reminder, field, value)

    db.commit()
    db.refresh(db_reminder)
    return ReminderResponse.from_orm(db_reminder)


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder."""
    db_reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )

    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(db_reminder)
    db.commit()
    return {"message": "Reminder deleted successfully"}
