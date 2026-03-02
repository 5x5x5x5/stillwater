"""Progress router: meditation logging, streaks, heatmap, and badges."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from stillpoint.db import get_db
from stillpoint.dependencies import get_current_user
from stillpoint.models.user import User
from stillpoint.schemas.progress import (
    BadgeResponse,
    HeatmapData,
    MeditationLogCreate,
    MeditationLogResponse,
    ProgressSummary,
)
from stillpoint.services.progress import (
    get_heatmap,
    get_progress_summary,
    get_user_badges,
    log_meditation,
)

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("/log", response_model=MeditationLogResponse, status_code=status.HTTP_201_CREATED)
async def log_meditation_endpoint(
    data: MeditationLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MeditationLogResponse:
    """Record a completed or partial meditation session for the current user.

    After logging, the user's streak is recalculated and any newly qualifying
    badges are automatically awarded.

    Args:
        data: Meditation log payload.
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        The created meditation log entry.
    """
    log = await log_meditation(db, current_user.id, data)
    return log  # type: ignore[return-value]


@router.get("/summary", response_model=ProgressSummary)
async def progress_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgressSummary:
    """Return a high-level progress summary for the current user.

    Includes total sessions, total minutes, current streak, longest streak,
    and the number of badges earned.

    Args:
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        A ``ProgressSummary`` with aggregated statistics.
    """
    return await get_progress_summary(db, current_user.id)


@router.get("/streak", response_model=ProgressSummary)
async def streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgressSummary:
    """Return streak information for the current user.

    This endpoint returns the same shape as ``/summary`` for convenience,
    allowing clients to poll just streak data without the full summary.

    Args:
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        A ``ProgressSummary`` (streak fields are the primary focus).
    """
    return await get_progress_summary(db, current_user.id)


@router.get("/heatmap", response_model=list[HeatmapData])
async def heatmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HeatmapData]:
    """Return per-day meditation counts for the last 365 days.

    Days with no sessions are omitted; the client should treat missing dates
    as a count of zero.

    Args:
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        A list of ``HeatmapData`` items sorted by date ascending.
    """
    return await get_heatmap(db, current_user.id)


@router.get("/badges", response_model=list[BadgeResponse])
async def badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BadgeResponse]:
    """Return all badges with an ``earned`` flag for the current user.

    Args:
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        All badges, each annotated with whether the user has earned it.
    """
    return await get_user_badges(db, current_user.id)
