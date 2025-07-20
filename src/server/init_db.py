# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Database initialization script.
Run this to create all tables in the database.
"""

import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from src.database.base import Base, engine
from src.database.models import (
    User,
    Task,
    Reminder,
    CalendarEvent,
    Note,
    Project,
    HealthData,
    Conversation,
)


def init_db():
    """Initialize the database by creating all tables."""
    print("Creating database tables...")

    # Create all tables
    Base.metadata.create_all(bind=engine)

    print("Database tables created successfully!")
    print("\nCreated tables:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")


if __name__ == "__main__":
    init_db()
