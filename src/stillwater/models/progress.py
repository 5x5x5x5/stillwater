from sqlalchemy import Column, Date, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from stillwater.db import Base, TimestampMixin, UUIDMixin

user_badges = Table(
    "user_badges",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("badge_id", String, ForeignKey("badges.id"), primary_key=True),
)


class MeditationLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "meditation_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    session_id: Mapped[str | None] = mapped_column(
        ForeignKey("sessions.id"), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[bool] = mapped_column(default=True)
    session_type: Mapped[str] = mapped_column(String(50), default="guided")

    user: Mapped["User"] = relationship(back_populates="meditation_logs")
    session: Mapped["Session | None"] = relationship()


class Streak(UUIDMixin, Base):
    __tablename__ = "streaks"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_meditation_date: Mapped[str | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="streak")


class Badge(UUIDMixin, Base):
    __tablename__ = "badges"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_value: Mapped[int] = mapped_column(Integer, nullable=False)

    users: Mapped[list["User"]] = relationship(
        secondary=user_badges, back_populates="badges"
    )
