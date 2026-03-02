"""Progress tracking service: meditation logging, streaks, badges, and summaries."""

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from stillwater.models.progress import Badge, MeditationLog, Streak, user_badges
from stillwater.schemas.progress import (
    BadgeResponse,
    HeatmapData,
    MeditationLogCreate,
    ProgressSummary,
)


async def log_meditation(
    db: AsyncSession, user_id: str, data: MeditationLogCreate
) -> MeditationLog:
    """Record a meditation session, then update the user's streak and badges.

    Args:
        db: The active async database session.
        user_id: The UUID of the user who completed the session.
        data: Validated meditation log payload.

    Returns:
        The newly created ``MeditationLog`` ORM instance.
    """
    log = MeditationLog(
        user_id=user_id,
        session_id=data.session_id,
        duration_seconds=data.duration_seconds,
        completed=data.completed,
        session_type=data.session_type,
    )
    db.add(log)
    await db.flush()

    await update_streak(db, user_id)
    await check_badges(db, user_id)

    await db.commit()
    await db.refresh(log)
    return log


async def update_streak(db: AsyncSession, user_id: str) -> Streak:
    """Recalculate the user's current and longest streak after a new log.

    Rules:
    - If the user meditated yesterday, increment the current streak.
    - If the user meditated today already, keep the streak as-is.
    - Otherwise, reset the current streak to 1.
    The longest streak is updated whenever the current streak exceeds it.

    Args:
        db: The active async database session.
        user_id: The UUID of the user whose streak should be updated.

    Returns:
        The updated ``Streak`` ORM instance.
    """
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()

    today = date.today()

    if streak is None:
        streak = Streak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_meditation_date=today,
        )
        db.add(streak)
    else:
        last = streak.last_meditation_date

        if last is None:
            streak.current_streak = 1
        elif last == today:
            # Already logged today — do not double-count.
            pass
        elif last == today - timedelta(days=1):
            streak.current_streak += 1
        else:
            # Gap in practice — reset.
            streak.current_streak = 1

        streak.last_meditation_date = today

        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

    await db.flush()
    return streak


async def check_badges(db: AsyncSession, user_id: str) -> None:
    """Award any badges the user has newly qualified for.

    Badge requirement types supported:
    - ``total_sessions``: total completed meditation logs >= requirement_value
    - ``streak``: current_streak >= requirement_value
    - ``categories``: distinct session categories logged >= requirement_value

    Args:
        db: The active async database session.
        user_id: The UUID of the user to check badges for.
    """
    # Fetch all badges and already-earned badge ids in parallel.
    all_badges_result = await db.execute(select(Badge))
    all_badges = list(all_badges_result.scalars())

    earned_result = await db.execute(
        select(user_badges.c.badge_id).where(user_badges.c.user_id == user_id)
    )
    earned_ids = {row[0] for row in earned_result}

    # Gather metrics needed for evaluation.
    total_sessions_result = await db.execute(
        select(func.count(MeditationLog.id)).where(MeditationLog.user_id == user_id)
    )
    total_sessions = total_sessions_result.scalar_one()

    streak_result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = streak_result.scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0

    categories_result = await db.execute(
        select(func.count(func.distinct(MeditationLog.session_type))).where(
            MeditationLog.user_id == user_id
        )
    )
    distinct_categories = categories_result.scalar_one()

    for badge in all_badges:
        if badge.id in earned_ids:
            continue

        qualified = False
        if badge.requirement_type == "total_sessions":
            qualified = total_sessions >= badge.requirement_value
        elif badge.requirement_type == "streak":
            qualified = current_streak >= badge.requirement_value
        elif badge.requirement_type == "categories":
            qualified = distinct_categories >= badge.requirement_value

        if qualified:
            await db.execute(
                user_badges.insert().values(user_id=user_id, badge_id=badge.id)
            )


async def get_progress_summary(db: AsyncSession, user_id: str) -> ProgressSummary:
    """Build a high-level progress summary for the given user.

    Args:
        db: The active async database session.
        user_id: The UUID of the user.

    Returns:
        A ``ProgressSummary`` schema instance with aggregated statistics.
    """
    total_sessions_result = await db.execute(
        select(func.count(MeditationLog.id)).where(MeditationLog.user_id == user_id)
    )
    total_sessions = total_sessions_result.scalar_one()

    total_seconds_result = await db.execute(
        select(func.coalesce(func.sum(MeditationLog.duration_seconds), 0)).where(
            MeditationLog.user_id == user_id
        )
    )
    total_seconds = total_seconds_result.scalar_one()
    total_minutes = total_seconds // 60

    streak_result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = streak_result.scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0
    longest_streak = streak.longest_streak if streak else 0

    badges_result = await db.execute(
        select(func.count()).select_from(user_badges).where(
            user_badges.c.user_id == user_id
        )
    )
    badges_earned = badges_result.scalar_one()

    return ProgressSummary(
        total_sessions=total_sessions,
        total_minutes=total_minutes,
        current_streak=current_streak,
        longest_streak=longest_streak,
        badges_earned=badges_earned,
    )


async def get_heatmap(db: AsyncSession, user_id: str) -> list[HeatmapData]:
    """Return daily meditation counts for the past 365 days.

    Days with no meditation activity are excluded from the result. The
    caller (or client) can treat missing dates as count=0.

    Args:
        db: The active async database session.
        user_id: The UUID of the user.

    Returns:
        A list of ``HeatmapData`` items sorted by date ascending.
    """
    cutoff = date.today() - timedelta(days=364)

    # func.date() works correctly for both SQLite (DATE() function) and
    # Postgres (which also supports DATE()). It extracts YYYY-MM-DD from
    # a datetime column regardless of the stored format.
    log_date_col = func.date(MeditationLog.created_at).label("log_date")

    result = await db.execute(
        select(
            log_date_col,
            func.count(MeditationLog.id).label("count"),
        )
        .where(MeditationLog.user_id == user_id)
        .where(func.date(MeditationLog.created_at) >= cutoff.isoformat())
        .group_by("log_date")
        .order_by("log_date")
    )

    return [
        HeatmapData(date=row.log_date, count=row.count)
        for row in result
    ]


async def get_user_badges(db: AsyncSession, user_id: str) -> list[BadgeResponse]:
    """Return all badges with an ``earned`` flag for the given user.

    Args:
        db: The active async database session.
        user_id: The UUID of the user.

    Returns:
        A list of ``BadgeResponse`` items with ``earned=True`` for badges the
        user has already been awarded.
    """
    all_badges_result = await db.execute(select(Badge).order_by(Badge.name))
    all_badges = list(all_badges_result.scalars())

    earned_result = await db.execute(
        select(user_badges.c.badge_id).where(user_badges.c.user_id == user_id)
    )
    earned_ids = {row[0] for row in earned_result}

    return [
        BadgeResponse(
            id=badge.id,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            requirement_type=badge.requirement_type,
            requirement_value=badge.requirement_value,
            earned=badge.id in earned_ids,
        )
        for badge in all_badges
    ]
