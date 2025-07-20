# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Float,
    JSON,
    ForeignKey,
    Text,
    Enum,
)
from sqlalchemy.orm import relationship
import enum

from .base import Base


class TaskStatus(enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    supabase_id = Column(String, unique=True, index=True, nullable=True)  # UUID from Supabase
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship(
        "Reminder", back_populates="user", cascade="all, delete-orphan"
    )
    calendar_events = relationship(
        "CalendarEvent", back_populates="user", cascade="all, delete-orphan"
    )
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )
    health_data = relationship(
        "HealthData", back_populates="user", cascade="all, delete-orphan"
    )
    conversations = relationship(
        "Conversation", back_populates="user", cascade="all, delete-orphan"
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    category = Column(String)
    due_date = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # For kanban tasks
    project_id = Column(Integer, ForeignKey("projects.id"))
    column_id = Column(String)  # For kanban column
    order = Column(Integer, default=0)  # For ordering within column

    # Relationships
    user = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    time = Column(String)  # Time in HH:MM format
    date = Column(DateTime)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    category = Column(String)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reminders")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    category = Column(String)
    color = Column(String)  # Hex color
    location = Column(String)
    is_all_day = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="calendar_events")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text)
    source = Column(String)  # youtube, instagram, tiktok, file, etc.
    source_url = Column(String)
    transcript = Column(Text)
    summary = Column(Text)
    meta_data = Column(JSON)  # Store additional data like video info, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notes")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String)  # Hex color
    icon = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class HealthData(Base):
    __tablename__ = "health_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Health metrics
    health_score = Column(Integer)
    hydration_ml = Column(Integer, default=0)
    hydration_goal_ml = Column(Integer, default=2000)
    sleep_hours = Column(Float)
    sleep_quality = Column(Integer)  # Percentage
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    pulse = Column(Integer)
    workouts_completed = Column(Integer, default=0)
    workouts_goal = Column(Integer, default=5)

    # Additional data as JSON
    sleep_phases = Column(JSON)  # {deep: %, light: %, rem: %}
    medications = Column(JSON)  # [{name, dosage, taken}]
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="health_data")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    thread_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String)
    query = Column(Text)
    messages = Column(JSON)  # Store messages as JSON
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
