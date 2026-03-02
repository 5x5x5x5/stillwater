"""Authentication service: password hashing and JWT token operations."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from stillwater.config import settings

_ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    """Return the bcrypt hash of a plain-text password.

    Args:
        plain_password: The raw password string supplied by the user.

    Returns:
        A bcrypt-hashed password string suitable for storage.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash.

    Args:
        plain_password: The raw password supplied by the user at login.
        hashed_password: The stored bcrypt hash to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(subject: str) -> str:
    """Create a signed JWT access token for the given subject (user id).

    The token expiry is controlled by settings.ACCESS_TOKEN_EXPIRE_MINUTES.

    Args:
        subject: A unique identifier for the token owner (typically user.id).

    Returns:
        A signed JWT string.
    """
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Decode a JWT access token and return the subject claim.

    Args:
        token: The JWT string to decode and verify.

    Returns:
        The ``sub`` claim (user id) if the token is valid, or None if it is
        expired, malformed, or missing the ``sub`` claim.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
        subject: str | None = payload.get("sub")
        return subject
    except jwt.PyJWTError:
        return None
