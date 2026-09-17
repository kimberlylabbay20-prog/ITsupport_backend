"""User controller with the user management endpoints.

Routes (physically defined here):
- GET    /users             list all users (admin only)
- GET    /users/{user_id}   view a user (admin only)
- PUT    /users/{user_id}   update a user (admin only)
- DELETE /users/{user_id}   delete a user (admin only)

Access control: strict admin via JWT. Regular users and staff are rejected
with 403, so no arbitrary user can access others or promote themselves.
Responses use UserResponse, which never includes password_hash, and any
password change is hashed with bcrypt before it is stored.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.postgres import get_db
from models.user import User
from schemas.user_schema import UserResponse, UserUpdate
from services.auth_service import require_admin
from services.user_service import delete_user, get_user, list_users, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def users_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[User]:
    """List all users (admin only)."""
    return list_users(db)


@router.get("/{user_id}", response_model=UserResponse)
def user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    """View a single user (admin only)."""
    return get_user(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def user_update(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    """Update a user, including role changes and secure password resets."""
    target = get_user(db, user_id)
    return update_user(db, target, payload, current_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def user_delete(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Delete a user; refuses to remove the last available admin account."""
    target = get_user(db, user_id)
    delete_user(db, target, current_user)