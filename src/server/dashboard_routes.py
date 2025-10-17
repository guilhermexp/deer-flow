# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from src.database.base import get_db
from src.database.models import Task, Reminder, User, TaskStatus, TaskPriority
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    category: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    title: str
    time: str  # HH:MM format
    date: Optional[datetime] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    category: Optional[str] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    time: Optional[str] = None
    date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    title: str
    time: str
    date: Optional[datetime] = None
    priority: TaskPriority
    category: Optional[str] = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    today_reminders: int
    upcoming_reminders: int


# Task endpoints
@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    category: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's tasks with optional filters."""
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)

    tasks = query.order_by(desc(Task.created_at)).offset(offset).limit(limit).all()
    return [TaskResponse.from_orm(task) for task in tasks]


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new task."""
    db_task = Task(user_id=current_user.id, **task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return TaskResponse.from_orm(db_task)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a task."""
    db_task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)

    # If marking as done, set completed_at
    if task_update.status == TaskStatus.DONE and not db_task.completed_at:
        db_task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_task)
    return TaskResponse.from_orm(db_task)


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a task."""
    db_task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}


# Reminder endpoints
@router.get("/reminders/today", response_model=List[ReminderResponse])
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


@router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders(
    date: Optional[datetime] = None,
    priority: Optional[TaskPriority] = None,
    category: Optional[str] = None,
    is_completed: Optional[bool] = None,
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


@router.post("/reminders", response_model=ReminderResponse)
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


@router.put("/reminders/{reminder_id}", response_model=ReminderResponse)
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


@router.delete("/reminders/{reminder_id}")
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


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get dashboard statistics."""
    # Task stats
    total_tasks = db.query(Task).filter(Task.user_id == current_user.id).count()
    completed_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.status == TaskStatus.DONE)
        .count()
    )
    pending_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
        )
        .count()
    )

    # Overdue tasks
    now = datetime.utcnow()
    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.DONE,
            Task.due_date < now,
        )
        .count()
    )

    # Reminder stats
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.date >= today_start,
            Reminder.date < today_end,
            Reminder.is_completed == False,
        )
        .count()
    )

    upcoming_reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.date >= now,
            Reminder.is_completed == False,
        )
        .count()
    )

    return DashboardStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        today_reminders=today_reminders,
        upcoming_reminders=upcoming_reminders,
    )
