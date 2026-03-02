"""Pydantic schemas for progress tracking request and response models."""

from datetime import datetime

from pydantic import BaseModel


class MeditationLogCreate(BaseModel):
    """Schema for logging a completed meditation session."""

    session_id: str | None = None
    duration_seconds: int
    completed: bool = True
    session_type: str = "guided"


class MeditationLogResponse(BaseModel):
    """Schema for returning a meditation log entry."""

    model_config = {"from_attributes": True}

    id: str
    user_id: str
    session_id: str | None
    duration_seconds: int
    completed: bool
    session_type: str
    created_at: datetime
    updated_at: datetime


class ProgressSummary(BaseModel):
    """Schema for returning a user's overall meditation progress summary."""

    total_sessions: int
    total_minutes: int
    current_streak: int
    longest_streak: int
    badges_earned: int


class HeatmapData(BaseModel):
    """Schema for a single day's meditation activity in the heatmap."""

    date: str  # ISO date string: YYYY-MM-DD
    count: int


class BadgeResponse(BaseModel):
    """Schema for returning badge data, including whether the user has earned it."""

    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str
    icon: str
    requirement_type: str
    requirement_value: int
    earned: bool
