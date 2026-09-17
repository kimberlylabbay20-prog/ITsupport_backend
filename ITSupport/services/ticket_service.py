"""Ticket business logic (service layer).

Staff ticket handling lives here behind reusable service functions so the
controllers stay thin.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database.base import utcnow
from models.ticket import Ticket
from models.user import User
from services.mongo_service import (
    NOTE_TYPE_ADMIN,
    NOTE_TYPE_WORK,
    add_ticket_note,
    log_activity,
)


def _assigned(ticket: Ticket, staff: User) -> bool:
    """True when the ticket is open to the caller (admin or assigned staff)."""
    return staff.role == "admin" or ticket.assigned_to == staff.user_id


def _raise_not_found() -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Ticket not found",
    )


def _raise_not_assigned() -> None:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Ticket is not assigned to you",
    )


def list_assigned_tickets(db: Session, staff: User) -> list[Ticket]:
    """Return the tickets a staff member can work on."""
    if staff.role == "admin":
        return (
            db.query(Ticket).order_by(Ticket.created_at.desc()).all()
        )
    return (
        db.query(Ticket)
        .filter(Ticket.assigned_to == staff.user_id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


def get_assigned_ticket(db: Session, ticket_id: int, staff: User) -> Ticket:
    """Return a ticket assigned to the staff member (404/403 otherwise)."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if ticket is None:
        _raise_not_found()
    if not _assigned(ticket, staff):
        _raise_not_assigned()
    return ticket


def list_all_tickets(db: Session) -> list[Ticket]:
    """Return every ticket in the system (admin view)."""
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()


def get_any_ticket(db: Session, ticket_id: int) -> Ticket:
    """Return a ticket regardless of assignment (admin view)."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if ticket is None:
        _raise_not_found()
    return ticket


def validate_assign_target(db: Session, assigned_to: int) -> User:
    """Validate an assignment target: must exist and have the staff role."""
    target = db.query(User).filter(User.user_id == assigned_to).first()
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assign target user not found",
        )
    if target.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only staff users can be assigned tickets",
        )
    return target


def assign_ticket(
    db: Session, ticket: Ticket, assigned_to: int, actor: User
) -> Ticket:
    """Assign a ticket to a staff user (validates the target role)."""
    validate_assign_target(db, assigned_to)
    previous_assignee = ticket.assigned_to
    ticket.assigned_to = assigned_to
    db.commit()
    db.refresh(ticket)
    log_activity(
        activity_type="ticket_assigned",
        performed_by=actor,
        ticket_id=ticket.ticket_id,
        old_value={"assigned_to": previous_assignee},
        new_value={"assigned_to": assigned_to},
    )
    return ticket


def set_ticket_status(
    db: Session, ticket: Ticket, new_status: str, actor: User
) -> Ticket:
    """Update the status of a ticket and manage resolved_at accordingly."""
    previous_status = ticket.status
    ticket.status = new_status
    if new_status == "RESOLVED":
        ticket.resolved_at = ticket.resolved_at or utcnow()
        activity_type = "ticket_resolved"
    else:
        ticket.resolved_at = None
        activity_type = "status_changed"
    db.commit()
    db.refresh(ticket)
    log_activity(
        activity_type=activity_type,
        performed_by=actor,
        ticket_id=ticket.ticket_id,
        old_value={"status": previous_status},
        new_value={"status": new_status, "resolved_at": ticket.resolved_at},
    )
    return ticket


def set_ticket_priority(
    db: Session, ticket: Ticket, new_priority: str, actor: User
) -> Ticket:
    """Update the priority of a ticket within the allowed values."""
    previous_priority = ticket.priority
    ticket.priority = new_priority
    db.commit()
    db.refresh(ticket)
    log_activity(
        activity_type="priority_changed",
        performed_by=actor,
        ticket_id=ticket.ticket_id,
        old_value={"priority": previous_priority},
        new_value={"priority": new_priority},
    )
    return ticket


def resolve_ticket(db: Session, ticket: Ticket, actor: User) -> Ticket:
    """Mark a ticket as resolved (sets resolved_at)."""
    return set_ticket_status(db, ticket, "RESOLVED", actor)


def delete_ticket(db: Session, ticket: Ticket, actor: User) -> None:
    """Delete a ticket and record the action in the activity log."""
    log_activity(
        activity_type="ticket_deleted",
        performed_by=actor,
        ticket_id=ticket.ticket_id,
        old_value={
            "title": ticket.title,
            "status": ticket.status,
            "priority": ticket.priority,
            "assigned_to": ticket.assigned_to,
        },
    )
    db.delete(ticket)
    db.commit()


def add_work_note(
    ticket: Ticket, actor: User, note: str, note_type: str = NOTE_TYPE_WORK
) -> dict:
    """Persist a ticket comment in MongoDB and return its record.

    Staff use "work_note"; admins use "admin_note". Comments are never
    written into the PostgreSQL ticket record.
    """
    return add_ticket_note(
        ticket_id=ticket.ticket_id,
        message=note,
        performed_by=actor,
        note_type=note_type,
    )


def add_admin_note(ticket: Ticket, actor: User, note: str) -> dict:
    """Persist an administrative note for a ticket in MongoDB."""
    return add_work_note(ticket, actor, note, note_type=NOTE_TYPE_ADMIN)