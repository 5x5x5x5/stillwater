"""Authentication router: registration, login, profile, and preference endpoints."""

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from stillwater.db import get_db
from stillwater.dependencies import get_current_user
from stillwater.models.user import User, UserPreference
from stillwater.schemas.user import (
    Token,
    UserCreate,
    UserPreferenceResponse,
    UserPreferenceUpdate,
    UserResponse,
)
from stillwater.services.auth import create_access_token, verify_password
from stillwater.services.user import create_user, get_user_by_email, update_preferences

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    """Register a new user account.

    Args:
        data: User creation payload with email, password, and display name.
        db: Injected database session.

    Returns:
        The newly created user.

    Raises:
        HTTPException(409): If the email address is already registered.
    """
    try:
        user = await create_user(db, data)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    # OAuth2 / Swagger form fields (optional — only present for form submissions)
    username: str | None = Form(default=None),
    password: str | None = Form(default=None),
) -> Token:
    """Authenticate a user and return a JWT access token.

    Supports two content types:

    - ``application/x-www-form-urlencoded`` with ``username`` (email) and
      ``password`` fields — used by Swagger UI's "Authorize" dialog.
    - ``application/json`` with ``email`` and ``password`` fields — used by
      the frontend and API clients.

    Returns:
        A ``Token`` containing the signed JWT access token.

    Raises:
        HTTPException(401): If the credentials are invalid.
        HTTPException(403): If the account is inactive.
    """
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        email: str = body.get("email", "")
        raw_password: str = body.get("password", "")
    else:
        # Form data (OAuth2 spec uses "username" for the identifier field).
        email = username or ""
        raw_password = password or ""

    if not email or not raw_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="email and password are required",
        )

    user = await get_user_by_email(db, email)
    if user is None or not verify_password(raw_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile of the currently authenticated user.

    Args:
        current_user: Injected authenticated user.

    Returns:
        The current user's profile data.
    """
    return current_user


@router.get("/me/preferences", response_model=UserPreferenceResponse)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserPreference:
    """Return the authenticated user's current preferences.

    Args:
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        The user's current ``UserPreference`` record.

    Raises:
        HTTPException(404): If no preference record exists for the user.
    """
    result = await db.execute(
        select(UserPreference)
        .where(UserPreference.user_id == current_user.id)
        .options(selectinload(UserPreference.user))
    )
    preference = result.scalar_one_or_none()
    if preference is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found",
        )
    return preference


@router.put("/me/preferences", response_model=UserPreferenceResponse)
async def update_my_preferences(
    data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserPreference:
    """Update the authenticated user's meditation preferences.

    Only fields present in the request body (non-null) are updated.

    Args:
        data: Preference update payload.
        current_user: Injected authenticated user.
        db: Injected database session.

    Returns:
        The updated preferences record.
    """
    preference = await update_preferences(db, current_user.id, data)
    return preference
