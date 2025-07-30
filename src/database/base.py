# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./deerflow.db")

# Connection pool configuration
pool_config = {}
if DATABASE_URL.startswith("postgresql"):
    pool_config = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "20")),  # Number of connections to maintain
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),  # Maximum overflow connections
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),  # Timeout for getting connection
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),  # Recycle connections after 1 hour
        "pool_pre_ping": True,  # Test connections before using them
        "echo_pool": os.getenv("DB_ECHO_POOL", "false").lower() == "true",  # Log pool checkouts/checkins
    }

# Create engine with optimized settings
engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
    **pool_config
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def create_tables():
    """Create all tables in the database"""
    # Import models to register them with Base
    from .models import (
        User,
        Project,
        Task,
        Conversation,
        HealthData,
        CalendarEvent,
        Note,
        Reminder,
    )

    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
