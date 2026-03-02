"""Pydantic schemas for meditation session request and response models."""

from datetime import datetime

from pydantic import BaseModel


class TagResponse(BaseModel):
    """Schema for returning tag data."""

    model_config = {"from_attributes": True}

    id: str
    name: str


class SessionResponse(BaseModel):
    """Schema for returning a single meditation session."""

    model_config = {"from_attributes": True}

    id: str
    title: str
    description: str | None
    category: str
    subcategory: str | None
    audio_url: str | None
    image_url: str | None
    duration_seconds: int
    instructor: str | None
    is_daily_pick: bool
    tags: list[TagResponse]
    created_at: datetime


class SessionListResponse(BaseModel):
    """Schema for returning a paginated list of meditation sessions."""

    items: list[SessionResponse]
    total: int
    page: int
    per_page: int
