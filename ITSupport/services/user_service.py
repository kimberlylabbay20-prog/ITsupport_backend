"""User management business logic (service layer).

Admin-only operations are validated here: unique identifiers, secure
password hashing, and protection of the last available admin account.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.ticket import Ticket
from models.user import User
from services.auth_service import hash_password
from services.mongo_service import log_activity

ADMIN_ROLE = "admin"


def _raise_not_found() -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )


def _raise_conflict(field: str, value: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"{field} already in use: {value}",
    )


def list_users(db: Session) -> list[User]:
    """Return all users."""
    return db.query(User).order_by(User.user_id.asc()).all()


def get_user(db: Session, user_id: int) -> User:
    """Return a user by id (404 when missing)."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        _raise_not_found()
    return user


def update_user(
    db: Session,
    target: User,
    payload: object,
    actor: User,
) -> User:
    """Update a user applying uniqueness, hashing, and admin-safety rules."""
    if payload.username is not None:
        taken = (
            db.query(User)
            .filter(User.username == payload.username, User.user_id != target.user_id)
            .first()
        )
        if taken is not None:
            _raise_conflict("Username", payload.username)
        target.username = payload.username

    if payload.email is not None:
        taken = (
            db.query(User)
            .filter(User.email == payload.email, User.user_id != target.user_id)
            .first()
        )
        if taken is not None:
            _raise_conflict("Email", payload.email)
        target.email = payload.email

    if payload.full_name is not None:
        target.full_name = payload.full_name

    if payload.password is not None:
        target.password_hash = hash_password(payload.password)

    old_role = target.role
    if payload.role is not None:
        if (
            target.user_id == actor.user_id
            and target.role == ADMIN_ROLE
            and payload.role != ADMIN_ROLE
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot change their own role",
            )
        target.role = payload.role

    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.commit()
    db.refresh(target)
    if target.role != old_role:
        log_activity(
            activity_type="user_role_changed",
            performed_by=actor,
            old_value={"role": old_role},
            new_value={"role": target.role},
            user_id=target.user_id,
            username=target.username,
        )
    return target


def delete_user(db: Session, target: User, actor: User) -> None:
    """Delete a user, protecting the last available admin account and
    unassigning tickets that point at the user before removal."""
    if target.role == ADMIN_ROLE:
        admin_count = db.query(User).filter(User.role == ADMIN_ROLE).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin account",
            )

    db.query(Ticket).filter(Ticket.assigned_to == target.user_id).update(
        {Ticket.assigned_to: None}, synchronize_session=False
    )
    db.delete(target)
    db.commit()
    log_activity(
        activity_type="user_deleted",
        performed_by=actor,
        old_value={
            "user_id": target.user_id,
            "username": target.username,
            "role": target.role,
        },
        deleted_user={
            "user_id": target.user_id,
            "username": target.username,
            "role": target.role,
        },
    )