"""Authentication utilities for the IT support desk.

Provides secure password hashing, verification, JWT creation and decoding,
plus FastAPI dependencies for the current user and role checks.

The JWT secret is read from config.py (loaded from .env); it is never
hardcoded in source code.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

import config
from database.postgres import get_db
from models.user import User

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security_scheme = HTTPBearer()


# --- Password hashing -------------------------------------------------------


def hash_password(password: str) -> str:
    """Hash a plaintext password; returns a bcrypt hash string."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Return True if the plaintext password matches the stored hash string."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# --- JWT --------------------------------------------------------------------


def create_access_token(subject: int, role: str) -> str:
    """Create a signed JWT that identifies the user id (sub) and role."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT. Raises JWTError if invalid or expired."""
    payload = jwt.decode(token, config.JWT_SECRET, algorithms=[ALGORITHM])
    if "sub" not in payload:
        raise JWTError("Token is missing the 'sub' claim")
    return payload


# --- Dependencies -----------------------------------------------------------


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the Authorization Bearer token."""
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        ) from exc

    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )
    return user


def require_role(*allowed_roles: str) -> Callable[..., User]:
    """Return a dependency that allows only users with one of the given roles."""

    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not permitted",
            )
        return current_user

    return role_dependency


# Reusable role gates. Staff can also pass admin-only? No: admin-only is
# strictly "admin". Staff functions admit admins as well.
require_admin = require_role("admin")
require_staff = require_role("staff", "admin")


def is_owner_or_admin(resource_owner_id: int, current_user: User) -> bool:
    """Return True if the caller owns the resource or is an admin.

    Regular users may only access their own resources; admins have
    system-wide access. It does not grant generic access to staff.
    """
    if current_user.role == "admin":
        return True
    return current_user.user_id == resource_owner_id


def require_owner(
    resource_owner_id: int,
    current_user: User = Depends(get_current_user),
) -> User:
    """Deny access unless the caller owns the resource or is an admin.

    Use after get_current_user for routes handling resources (e.g. a
    user's profile or their own tickets).
    """
    if not is_owner_or_admin(resource_owner_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    return current_user