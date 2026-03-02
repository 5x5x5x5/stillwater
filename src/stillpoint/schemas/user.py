"""Pydantic schemas for user-related request and response models."""

import re
from datetime import datetime

from pydantic import BaseModel, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserCreate(BaseModel):
    """Schema for creating a new user account."""

    email: str
    password: str
    display_name: str

    @field_validator("email")
    @classmethod
    def email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("display_name")
    @classmethod
    def display_name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Display name must not be blank")
        return v.strip()


class UserResponse(BaseModel):
    """Schema for returning user data in API responses."""

    model_config = {"from_attributes": True}

    id: str
    email: str
    display_name: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    """Schema for JWT authentication token response."""

    access_token: str
    token_type: str = "bearer"


class UserPreferenceResponse(BaseModel):
    """Schema for returning user preference data."""

    model_config = {"from_attributes": True}

    id: str
    user_id: str
    preferred_duration: int
    theme: str
    bell_sound: str
    ambient_default: str
    created_at: datetime
    updated_at: datetime


class UserPreferenceUpdate(BaseModel):
    """Schema for updating user preferences. All fields are optional."""

    preferred_duration: int | None = None
    theme: str | None = None
    bell_sound: str | None = None
    ambient_default: str | None = None

    @field_validator("preferred_duration")
    @classmethod
    def duration_positive(cls, v: int | None) -> int | None:
        if v is not None and v <= 0:
            raise ValueError("preferred_duration must be a positive integer")
        return v
