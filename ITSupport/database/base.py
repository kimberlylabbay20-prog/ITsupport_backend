"""Shared SQLAlchemy declarative base and helpers for the ORM models."""

from datetime import datetime, timezone

from sqlalchemy.orm import DeclarativeBase


def utcnow() -> datetime:
    """Return the current UTC time for timestamp defaults."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Declarative base inherited by all ORM models."""