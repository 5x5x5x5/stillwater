"""FastAPI dependency providers for authentication and database access."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from stillwater.db import get_db
from stillwater.models.user import User
from stillwater.services.auth import decode_access_token
from stillwater.services.user import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the currently authenticated user from a Bearer token.

    Extracts the JWT from the ``Authorization`` header, decodes it, and
    fetches the corresponding user from the database.

    Args:
        token: The Bearer token extracted by OAuth2PasswordBearer.
        db: The active async database session.

    Returns:
        The authenticated and active ``User`` ORM instance.

    Raises:
        HTTPException(401): If the token is invalid, expired, or the user
            does not exist.
        HTTPException(403): If the user account is inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception

    user = await get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user
