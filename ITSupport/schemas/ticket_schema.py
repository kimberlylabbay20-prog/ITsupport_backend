"""Pydantic schemas for support tickets."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

PriorityLiteral = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
StatusLiteral = Literal["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]


class TicketCreate(BaseModel):
    category_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    priority: PriorityLiteral = "MEDIUM"


class TicketUpdate(BaseModel):
    category_id: int | None = None
    assigned_to: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    priority: PriorityLiteral | None = None
    status: StatusLiteral | None = None
    resolved_at: datetime | None = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: int
    user_id: int
    category_id: int
    assigned_to: int | None = None
    title: str
    description: str
    priority: PriorityLiteral
    status: StatusLiteral
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None


class TicketStatusUpdate(BaseModel):
    status: StatusLiteral


class TicketPriorityUpdate(BaseModel):
    priority: PriorityLiteral


class TicketAssignRequest(BaseModel):
    assigned_to: int


class WorkNoteRequest(BaseModel):
    """A ticket comment. Accepts either 'note' (legacy) or 'message'."""

    note: str | None = Field(default=None, min_length=1, max_length=2000)
    message: str | None = Field(default=None, min_length=1, max_length=2000)

    @model_validator(mode="after")
    def _require_content(self) -> "WorkNoteRequest":
        if not self.note and not self.message:
            raise ValueError("Provide a 'note' or 'message'")
        return self

    @property
    def text(self) -> str:
        return self.message or self.note


class WorkNoteResponse(BaseModel):
    note_id: str
    ticket_id: int
    activity_type: str
    performed_by: dict
    message: str
    note: str
    author: str
    created_at: datetime