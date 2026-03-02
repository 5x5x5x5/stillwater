"""Sessions router: browsing, searching, and retrieving meditation sessions."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from stillwater.db import get_db
from stillwater.models.session import Session, Tag
from stillwater.schemas.session import SessionListResponse, SessionResponse, TagResponse
from stillwater.services.session import (
    get_categories,
    get_daily_pick,
    get_session,
    get_tags,
    list_sessions,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("/categories", response_model=list[str])
async def categories(db: AsyncSession = Depends(get_db)) -> list[str]:
    """Return all distinct session categories.

    This route is declared before ``/{session_id}`` to prevent "categories"
    from being interpreted as a session UUID path parameter.

    Args:
        db: Injected database session.

    Returns:
        A sorted list of distinct category strings.
    """
    return await get_categories(db)


@router.get("/tags", response_model=list[TagResponse])
async def tags(db: AsyncSession = Depends(get_db)) -> list[Tag]:
    """Return all available tags.

    This route is declared before ``/{session_id}`` to prevent "tags" from
    being interpreted as a session UUID path parameter.

    Args:
        db: Injected database session.

    Returns:
        A list of all ``Tag`` records.
    """
    return await get_tags(db)


@router.get("/daily", response_model=SessionResponse)
async def daily_pick(db: AsyncSession = Depends(get_db)) -> Session:
    """Return the session currently marked as the daily pick.

    Args:
        db: Injected database session.

    Returns:
        The daily-pick session.

    Raises:
        HTTPException(404): If no daily pick is currently set.
    """
    session = await get_daily_pick(db)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily pick is currently set",
        )
    return session


@router.get("", response_model=SessionListResponse)
async def list_sessions_endpoint(
    category: str | None = Query(default=None, description="Filter by category"),
    subcategory: str | None = Query(default=None, description="Filter by subcategory"),
    tag: str | None = Query(default=None, description="Filter by tag name"),
    min_duration: int | None = Query(default=None, ge=0, description="Min duration (seconds)"),
    max_duration: int | None = Query(default=None, ge=0, description="Max duration (seconds)"),
    search: str | None = Query(default=None, description="Search in title and description"),
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(default=20, ge=1, le=100, description="Results per page"),
    db: AsyncSession = Depends(get_db),
) -> SessionListResponse:
    """Return a paginated list of sessions with optional filters.

    Args:
        category: Exact category match (e.g. ``guided``, ``sleep_story``).
        subcategory: Exact subcategory match (e.g. ``stress``, ``focus``).
        tag: Tag name filter; returns sessions that include the tag.
        min_duration: Minimum session duration in seconds (inclusive).
        max_duration: Maximum session duration in seconds (inclusive).
        search: Substring search across title and description (case-insensitive).
        page: Page number starting at 1.
        per_page: Number of items per page (max 100).
        db: Injected database session.

    Returns:
        A paginated ``SessionListResponse`` with matching sessions.
    """
    sessions, total = await list_sessions(
        db,
        category=category,
        subcategory=subcategory,
        tag=tag,
        min_duration=min_duration,
        max_duration=max_duration,
        search=search,
        page=page,
        per_page=per_page,
    )
    return SessionListResponse(
        items=sessions,  # type: ignore[arg-type]
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_endpoint(
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> Session:
    """Return a single session by its UUID.

    Args:
        session_id: The UUID of the requested session.
        db: Injected database session.

    Returns:
        The matching session with its tags.

    Raises:
        HTTPException(404): If no session with the given ID exists.
    """
    session = await get_session(db, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
        )
    return session
