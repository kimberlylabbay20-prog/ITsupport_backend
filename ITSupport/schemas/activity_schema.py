"""Pydantic schema for the admin activity/history feed."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    activity_id: str
    activity_type: str
    ticket_id: int | None = None
    performed_by: dict | None = None
    author: str | None = None
    message: str | None = None
    old_value: Any = None
    new_value: Any = None
    timestamp: datetime | None = None