"""Session query service: listing, filtering, and retrieval of meditation sessions."""

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from stillpoint.models.session import Session, Tag, session_tags


async def list_sessions(
    db: AsyncSession,
    *,
    category: str | None = None,
    subcategory: str | None = None,
    tag: str | None = None,
    min_duration: int | None = None,
    max_duration: int | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[Session], int]:
    """Return a paginated, optionally filtered list of sessions.

    All filter parameters are optional and combined with AND logic.

    Args:
        db: The active async database session.
        category: Exact category name filter (e.g. "guided").
        subcategory: Exact subcategory name filter (e.g. "stress").
        tag: Tag name filter — returns sessions that include this tag.
        min_duration: Minimum duration in seconds (inclusive).
        max_duration: Maximum duration in seconds (inclusive).
        search: Case-insensitive substring match against title and description.
        page: 1-based page number.
        per_page: Number of results per page (capped at 100 internally).

    Returns:
        A 2-tuple of (session list for the current page, total matching count).
    """
    per_page = min(per_page, 100)
    offset = (page - 1) * per_page

    base_query = select(Session).options(selectinload(Session.tags))

    if category is not None:
        base_query = base_query.where(Session.category == category)
    if subcategory is not None:
        base_query = base_query.where(Session.subcategory == subcategory)
    if min_duration is not None:
        base_query = base_query.where(Session.duration_seconds >= min_duration)
    if max_duration is not None:
        base_query = base_query.where(Session.duration_seconds <= max_duration)
    if search is not None:
        pattern = f"%{search}%"
        base_query = base_query.where(
            Session.title.ilike(pattern) | Session.description.ilike(pattern)
        )
    if tag is not None:
        # Join through the association table to filter by tag name.
        base_query = base_query.join(
            session_tags, Session.id == session_tags.c.session_id
        ).join(Tag, Tag.id == session_tags.c.tag_id).where(Tag.name == tag)

    # Build a count query from the same filters but without loading relations.
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply ordering and pagination.
    paginated_query = base_query.order_by(Session.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(paginated_query)
    sessions = list(result.scalars().unique())

    return sessions, total


async def get_session(db: AsyncSession, session_id: str) -> Session | None:
    """Retrieve a single session by its UUID, including its tags.

    Args:
        db: The active async database session.
        session_id: The string UUID of the session.

    Returns:
        The matching ``Session`` instance with tags loaded, or None.
    """
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.tags))
    )
    return result.scalar_one_or_none()


async def get_daily_pick(db: AsyncSession) -> Session | None:
    """Return the session currently marked as the daily pick.

    If multiple sessions are marked, the most recently created one is returned.

    Args:
        db: The active async database session.

    Returns:
        The daily-pick ``Session`` with tags loaded, or None if none is set.
    """
    result = await db.execute(
        select(Session)
        .where(Session.is_daily_pick.is_(True))
        .options(selectinload(Session.tags))
        .order_by(Session.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_categories(db: AsyncSession) -> list[str]:
    """Return a sorted list of all distinct session categories.

    Args:
        db: The active async database session.

    Returns:
        A list of unique category strings, sorted alphabetically.
    """
    result = await db.execute(select(distinct(Session.category)).order_by(Session.category))
    return list(result.scalars())


async def get_tags(db: AsyncSession) -> list[Tag]:
    """Return all tags ordered by name.

    Args:
        db: The active async database session.

    Returns:
        A list of all ``Tag`` ORM instances.
    """
    result = await db.execute(select(Tag).order_by(Tag.name))
    return list(result.scalars())
