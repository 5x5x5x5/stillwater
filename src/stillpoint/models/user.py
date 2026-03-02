from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from stillpoint.db import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    preference: Mapped["UserPreference | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    meditation_logs: Mapped[list["MeditationLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    streak: Mapped["Streak | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    badges: Mapped[list["Badge"]] = relationship(
        secondary="user_badges", back_populates="users"
    )


class UserPreference(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    preferred_duration: Mapped[int] = mapped_column(Integer, default=10)
    theme: Mapped[str] = mapped_column(String(20), default="dark")
    bell_sound: Mapped[str] = mapped_column(String(50), default="tibetan")
    ambient_default: Mapped[str] = mapped_column(String(50), default="none")

    user: Mapped["User"] = relationship(back_populates="preference")
