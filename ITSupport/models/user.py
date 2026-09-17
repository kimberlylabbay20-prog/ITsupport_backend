"""User model for the IT support desk.

A user can be a regular end user, IT staff, or an admin.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base, utcnow


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint("role IN ('user', 'staff', 'admin')", name="ck_users_role"),
    )

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    tickets: Mapped[list[Ticket]] = relationship(
        "Ticket",
        back_populates="creator",
        foreign_keys="Ticket.user_id",
        cascade="all, delete-orphan",
    )
    assigned_tickets: Mapped[list[Ticket]] = relationship(
        "Ticket",
        back_populates="assignee",
        foreign_keys="Ticket.assigned_to",
    )