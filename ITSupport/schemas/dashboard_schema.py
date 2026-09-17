"""Pydantic schema for the admin dashboard response."""

from __future__ import annotations

from typing import Dict

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress: int
    resolved_tickets: int
    closed_tickets: int
    high_priority: int
    by_status: Dict[str, int]
    by_priority: Dict[str, int]