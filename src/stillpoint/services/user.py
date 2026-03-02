"""User CRUD service: creation, lookup, and preference management."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from stillpoint.models.user import User, UserPreference
from stillpoint.schemas.user import UserCreate, UserPreferenceUpdate
from stillpoint.services.auth import hash_password


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    """Create a new user with hashed password and default preferences.

    A ``UserPreference`` row is created alongside the user so that
    preference endpoints always have a record to work with.

    Args:
        db: The active async database session.
        data: Validated user creation payload.

    Returns:
        The newly created and persisted ``User`` ORM instance.

    Raises:
        sqlalchemy.exc.IntegrityError: If a user with the given email already
            exists (the caller should catch and re-raise as HTTP 409).
    """
    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    await db.flush()  # populate user.id before creating preference

    preference = UserPreference(user_id=user.id)
    db.add(preference)

    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Retrieve a user by their email address.

    Args:
        db: The active async database session.
        email: The email address to look up (case-insensitive).

    Returns:
        The matching ``User`` instance, or None if not found.
    """
    result = await db.execute(
        select(User).where(User.email == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Retrieve a user by their UUID primary key.

    Args:
        db: The active async database session.
        user_id: The string UUID of the user.

    Returns:
        The matching ``User`` instance, or None if not found.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_preferences(
    db: AsyncSession, user_id: str, data: UserPreferenceUpdate
) -> UserPreference:
    """Update a user's preferences, creating the record if it does not exist.

    Only fields explicitly provided (non-None) in ``data`` are written.

    Args:
        db: The active async database session.
        user_id: The UUID of the user whose preferences should be updated.
        data: Validated preference update payload.

    Returns:
        The updated ``UserPreference`` ORM instance.
    """
    result = await db.execute(
        select(UserPreference)
        .where(UserPreference.user_id == user_id)
        .options(selectinload(UserPreference.user))
    )
    preference = result.scalar_one_or_none()

    if preference is None:
        preference = UserPreference(user_id=user_id)
        db.add(preference)

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(preference, field, value)

    await db.commit()
    await db.refresh(preference)
    return preference
