# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from src.database.base import get_db
from src.database.models import CalendarEvent, User
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    date: datetime
    end_date: datetime | None = None
    category: str | None = None
    color: str | None = "#3B82F6"  # Default blue color
    location: str | None = None
    is_all_day: bool = False


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    date: datetime | None = None
    end_date: datetime | None = None
    category: str | None = None
    color: str | None = None
    location: str | None = None
    is_all_day: bool | None = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    date: datetime
    end_date: datetime | None = None
    category: str | None = None
    color: str
    location: str | None = None
    is_all_day: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/events", response_model=list[EventResponse])
async def get_events(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category: str | None = None,
    limit: int = Query(500, le=1000),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's calendar events with optional date range filter."""
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)

    # Date range filter
    if start_date and end_date:
        # Get events that overlap with the date range
        query = query.filter(
            or_(
                # Event starts within range
                and_(CalendarEvent.date >= start_date, CalendarEvent.date <= end_date),
                # Event ends within range
                and_(
                    CalendarEvent.end_date >= start_date,
                    CalendarEvent.end_date <= end_date,
                ),
                # Event spans the entire range
                and_(
                    CalendarEvent.date <= start_date,
                    or_(
                        CalendarEvent.end_date >= end_date,
                        CalendarEvent.end_date.is_(None),
                    ),
                ),
            )
        )
    elif start_date:
        query = query.filter(CalendarEvent.date >= start_date)
    elif end_date:
        query = query.filter(CalendarEvent.date <= end_date)

    if category:
        query = query.filter(CalendarEvent.category == category)

    events = query.order_by(CalendarEvent.date).offset(offset).limit(limit).all()
    return [EventResponse.from_orm(event) for event in events]


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific calendar event."""
    event = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
        .first()
    )

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventResponse.from_orm(event)


@router.post("/events", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new calendar event."""
    # Validate end_date is after date
    if event.end_date and event.end_date < event.date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    db_event = CalendarEvent(user_id=current_user.id, **event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return EventResponse.from_orm(db_event)


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a calendar event."""
    db_event = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
        .first()
    )

    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Update fields
    update_data = event_update.dict(exclude_unset=True)

    # Validate dates if both are being updated
    if "date" in update_data and "end_date" in update_data:
        if update_data["end_date"] and update_data["end_date"] < update_data["date"]:
            raise HTTPException(
                status_code=400, detail="End date must be after start date"
            )
    # Validate against existing dates
    elif "end_date" in update_data and update_data["end_date"]:
        if update_data["end_date"] < db_event.date:
            raise HTTPException(
                status_code=400, detail="End date must be after start date"
            )
    elif "date" in update_data and db_event.end_date:
        if db_event.end_date < update_data["date"]:
            raise HTTPException(
                status_code=400, detail="End date must be after start date"
            )

    for field, value in update_data.items():
        setattr(db_event, field, value)

    db.commit()
    db.refresh(db_event)
    return EventResponse.from_orm(db_event)


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a calendar event."""
    db_event = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
        .first()
    )

    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}


@router.get("/events/month/{year}/{month}", response_model=list[EventResponse])
async def get_events_by_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get events for a specific month."""
    # Calculate start and end of month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

    return await get_events(
        start_date=start_date, end_date=end_date, current_user=current_user, db=db
    )
