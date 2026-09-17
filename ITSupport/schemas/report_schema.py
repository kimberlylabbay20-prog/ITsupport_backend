"""Pydantic schema for the admin reports response."""

from __future__ import annotations

from typing import Dict

from pydantic import BaseModel


class AdminReport(BaseModel):
    tickets_by_category: Dict[str, int]
    tickets_by_status: Dict[str, int]
    tickets_by_priority: Dict[str, int]
    tickets_by_assigned_staff: Dict[str, int]
    total_open_tickets: int
    total_resolved_tickets: int