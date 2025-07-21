# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.database.base import get_db
from src.database.models import HealthData, User
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/health", tags=["health"])


class SleepPhases(BaseModel):
    deep: int = Field(ge=0, le=100)
    light: int = Field(ge=0, le=100)
    rem: int = Field(ge=0, le=100)
    awake: int = Field(ge=0, le=100)


class Medication(BaseModel):
    name: str
    dosage: str
    taken: bool = False
    time: Optional[str] = None


class HealthDataCreate(BaseModel):
    date: Optional[datetime] = None
    health_score: Optional[int] = Field(None, ge=0, le=100)
    hydration_ml: Optional[int] = Field(None, ge=0)
    hydration_goal_ml: Optional[int] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=0, le=100)
    blood_pressure_systolic: Optional[int] = Field(None, ge=0)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=0)
    pulse: Optional[int] = Field(None, ge=0)
    workouts_completed: Optional[int] = Field(None, ge=0)
    workouts_goal: Optional[int] = Field(None, ge=0)
    sleep_phases: Optional[SleepPhases] = None
    medications: Optional[List[Medication]] = None
    notes: Optional[str] = None


class HealthDataUpdate(BaseModel):
    health_score: Optional[int] = Field(None, ge=0, le=100)
    hydration_ml: Optional[int] = Field(None, ge=0)
    hydration_goal_ml: Optional[int] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=0, le=100)
    blood_pressure_systolic: Optional[int] = Field(None, ge=0)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=0)
    pulse: Optional[int] = Field(None, ge=0)
    workouts_completed: Optional[int] = Field(None, ge=0)
    workouts_goal: Optional[int] = Field(None, ge=0)
    sleep_phases: Optional[SleepPhases] = None
    medications: Optional[List[Medication]] = None
    notes: Optional[str] = None


class HealthDataResponse(BaseModel):
    id: int
    date: datetime
    health_score: Optional[int] = None
    hydration_ml: int
    hydration_goal_ml: int
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    pulse: Optional[int] = None
    workouts_completed: int
    workouts_goal: int
    sleep_phases: Optional[Dict[str, int]] = None
    medications: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HealthStats(BaseModel):
    avg_health_score: Optional[float] = None
    avg_sleep_hours: Optional[float] = None
    avg_sleep_quality: Optional[float] = None
    total_workouts: int
    avg_hydration_ml: float
    hydration_goal_achievement: float
    workout_goal_achievement: float
    days_tracked: int


@router.get("/data", response_model=List[HealthDataResponse])
async def get_health_data(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(30, le=365),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's health data with optional date range filter."""
    query = db.query(HealthData).filter(HealthData.user_id == current_user.id)

    if start_date:
        query = query.filter(HealthData.date >= start_date)
    if end_date:
        query = query.filter(HealthData.date <= end_date)

    health_data = (
        query.order_by(desc(HealthData.date)).offset(offset).limit(limit).all()
    )
    return [HealthDataResponse.from_orm(data) for data in health_data]


@router.get("/data/today", response_model=Optional[HealthDataResponse])
async def get_today_health_data(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get today's health data."""
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    health_data = (
        db.query(HealthData)
        .filter(
            HealthData.user_id == current_user.id,
            HealthData.date >= start_of_day,
            HealthData.date <= end_of_day,
        )
        .first()
    )

    if health_data:
        return HealthDataResponse.from_orm(health_data)
    return None


@router.get("/data/{date}", response_model=Optional[HealthDataResponse])
async def get_health_data_by_date(
    date: datetime,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get health data for a specific date."""
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    health_data = (
        db.query(HealthData)
        .filter(
            HealthData.user_id == current_user.id,
            HealthData.date >= start_of_day,
            HealthData.date < end_of_day,
        )
        .first()
    )

    if health_data:
        return HealthDataResponse.from_orm(health_data)
    return None


@router.post("/data", response_model=HealthDataResponse)
async def create_or_update_health_data(
    data: HealthDataCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create or update health data for a date."""
    # Use provided date or today
    if data.date:
        target_date = data.date
    else:
        target_date = datetime.utcnow()

    # Check if data already exists for this date
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    existing_data = (
        db.query(HealthData)
        .filter(
            HealthData.user_id == current_user.id,
            HealthData.date >= start_of_day,
            HealthData.date < end_of_day,
        )
        .first()
    )

    if existing_data:
        # Update existing data
        update_data = data.dict(exclude_unset=True, exclude={"date"})

        # Handle JSON fields
        if "sleep_phases" in update_data and update_data["sleep_phases"]:
            update_data["sleep_phases"] = update_data["sleep_phases"].dict()
        if "medications" in update_data and update_data["medications"]:
            update_data["medications"] = [
                med.dict() for med in update_data["medications"]
            ]

        for field, value in update_data.items():
            setattr(existing_data, field, value)

        db.commit()
        db.refresh(existing_data)
        return HealthDataResponse.from_orm(existing_data)
    else:
        # Create new data
        create_data = data.dict(exclude_unset=True)

        # Set date
        create_data["date"] = target_date

        # Handle JSON fields
        if "sleep_phases" in create_data and create_data["sleep_phases"]:
            create_data["sleep_phases"] = create_data["sleep_phases"].dict()
        if "medications" in create_data and create_data["medications"]:
            create_data["medications"] = [
                med.dict() for med in create_data["medications"]
            ]

        # Set defaults
        if "hydration_goal_ml" not in create_data:
            create_data["hydration_goal_ml"] = 2000
        if "workouts_goal" not in create_data:
            create_data["workouts_goal"] = 5

        db_health_data = HealthData(user_id=current_user.id, **create_data)
        db.add(db_health_data)
        db.commit()
        db.refresh(db_health_data)
        return HealthDataResponse.from_orm(db_health_data)


@router.put("/data/{data_id}", response_model=HealthDataResponse)
async def update_health_data(
    data_id: int,
    data_update: HealthDataUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update specific health data entry."""
    db_health_data = (
        db.query(HealthData)
        .filter(HealthData.id == data_id, HealthData.user_id == current_user.id)
        .first()
    )

    if not db_health_data:
        raise HTTPException(status_code=404, detail="Health data not found")

    # Update fields
    update_data = data_update.dict(exclude_unset=True)

    # Handle JSON fields
    if "sleep_phases" in update_data and update_data["sleep_phases"]:
        update_data["sleep_phases"] = update_data["sleep_phases"].dict()
    if "medications" in update_data and update_data["medications"]:
        update_data["medications"] = [med.dict() for med in update_data["medications"]]

    for field, value in update_data.items():
        setattr(db_health_data, field, value)

    db.commit()
    db.refresh(db_health_data)
    return HealthDataResponse.from_orm(db_health_data)


@router.delete("/data/{data_id}")
async def delete_health_data(
    data_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete specific health data entry."""
    db_health_data = (
        db.query(HealthData)
        .filter(HealthData.id == data_id, HealthData.user_id == current_user.id)
        .first()
    )

    if not db_health_data:
        raise HTTPException(status_code=404, detail="Health data not found")

    db.delete(db_health_data)
    db.commit()
    return {"message": "Health data deleted successfully"}


@router.get("/stats", response_model=HealthStats)
async def get_health_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get health statistics for the past N days."""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    health_data = (
        db.query(HealthData)
        .filter(
            HealthData.user_id == current_user.id,
            HealthData.date >= start_date,
            HealthData.date <= end_date,
        )
        .all()
    )

    if not health_data:
        return HealthStats(
            avg_health_score=None,
            avg_sleep_hours=None,
            avg_sleep_quality=None,
            total_workouts=0,
            avg_hydration_ml=0,
            hydration_goal_achievement=0,
            workout_goal_achievement=0,
            days_tracked=0,
        )

    # Calculate statistics
    health_scores = [d.health_score for d in health_data if d.health_score is not None]
    sleep_hours = [d.sleep_hours for d in health_data if d.sleep_hours is not None]
    sleep_qualities = [
        d.sleep_quality for d in health_data if d.sleep_quality is not None
    ]

    total_workouts = sum(d.workouts_completed for d in health_data)
    total_hydration = sum(d.hydration_ml for d in health_data)

    # Goal achievements
    hydration_achievements = [
        min(d.hydration_ml / d.hydration_goal_ml, 1.0)
        for d in health_data
        if d.hydration_goal_ml > 0
    ]
    workout_achievements = [
        min(d.workouts_completed / d.workouts_goal, 1.0)
        for d in health_data
        if d.workouts_goal > 0
    ]

    return HealthStats(
        avg_health_score=(
            sum(health_scores) / len(health_scores) if health_scores else None
        ),
        avg_sleep_hours=sum(sleep_hours) / len(sleep_hours) if sleep_hours else None,
        avg_sleep_quality=(
            sum(sleep_qualities) / len(sleep_qualities) if sleep_qualities else None
        ),
        total_workouts=total_workouts,
        avg_hydration_ml=total_hydration / len(health_data),
        hydration_goal_achievement=(
            sum(hydration_achievements) / len(hydration_achievements)
            if hydration_achievements
            else 0
        ),
        workout_goal_achievement=(
            sum(workout_achievements) / len(workout_achievements)
            if workout_achievements
            else 0
        ),
        days_tracked=len(health_data),
    )
