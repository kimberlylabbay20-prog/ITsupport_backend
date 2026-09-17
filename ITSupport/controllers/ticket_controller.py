"""Ticket controller with ticket routes.

Routes (physically defined here):
- POST   /tickets                 submit a new support ticket
- GET    /tickets                 list tickets by role
- GET    /tickets/my              list the current user's own tickets
- GET    /tickets/status/{status} list tickets filtered by status
- GET    /tickets/{ticket_id}     view one ticket
- PUT    /tickets/{ticket_id}     update a ticket (role-aware)
- DELETE /tickets/{ticket_id}     delete/cancel a ticket (role-aware)

Static routes are declared before /{ticket_id} to avoid route conflicts.
Regular users can only access their own tickets; staff only their queue;
admins have system-wide access.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.base import utcnow
from database.postgres import get_db
from models.category import Category
from models.ticket import Ticket
from models.user import User
from schemas.ticket_schema import StatusLiteral, TicketCreate, TicketResponse, TicketUpdate
from services.auth_service import get_current_user
from services.mongo_service import log_activity
from services.ticket_service import (
    delete_ticket as service_delete_ticket,
    validate_assign_target,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _can_access_ticket(current_user: User, ticket: Ticket) -> bool:
    """Return True if the user may access the given ticket.

    - admin: any ticket
    - staff: tickets they created or that are assigned to them
    - user:  only their own tickets
    """
    if current_user.role == "admin":
        return True
    if current_user.role == "staff":
        return (
            ticket.user_id == current_user.user_id
            or ticket.assigned_to == current_user.user_id
        )
    return ticket.user_id == current_user.user_id


def _require_category(db: Session, category_id: int) -> None:
    if db.query(Category).filter(Category.category_id == category_id).first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )


def _get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
    return ticket


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    """Create a new ticket owned by the authenticated user.

    The user_id is always taken from the authenticated user, the ticket is
    never assigned to staff here, and it always starts with status OPEN.
    """
    _require_category(db, payload.category_id)

    ticket = Ticket(
        user_id=current_user.user_id,
        category_id=payload.category_id,
        assigned_to=None,
        title=payload.title,
        description=payload.description,
        priority=payload.priority or "MEDIUM",
        status="OPEN",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    log_activity(
        activity_type="ticket_created",
        performed_by=current_user,
        ticket_id=ticket.ticket_id,
        old_value=None,
        new_value={
            "status": ticket.status,
            "priority": ticket.priority,
            "category_id": ticket.category_id,
            "title": ticket.title,
        },
    )
    return ticket


@router.get("", response_model=list[TicketResponse])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    """List tickets according to the caller's role.

    Regular users see only their own tickets; staff see their assigned
    queue; admins see all tickets.
    """
    query = db.query(Ticket)
    if current_user.role == "user":
        query = query.filter(Ticket.user_id == current_user.user_id)
    elif current_user.role == "staff":
        query = query.filter(Ticket.assigned_to == current_user.user_id)
    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/my", response_model=list[TicketResponse])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    """List tickets created by the authenticated user."""
    return (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.user_id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


@router.get("/status/{status}", response_model=list[TicketResponse])
def tickets_by_status(
    status: StatusLiteral,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    """List tickets filtered by status, scoped to the caller's role."""
    query = db.query(Ticket).filter(Ticket.status == status)
    if current_user.role == "user":
        query = query.filter(Ticket.user_id == current_user.user_id)
    elif current_user.role == "staff":
        query = query.filter(Ticket.assigned_to == current_user.user_id)
    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    """View a single ticket. Users cannot view another user's ticket."""
    ticket = _get_ticket_or_404(db, ticket_id)
    if not _can_access_ticket(current_user, ticket):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket",
        )
    return ticket


@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    """Update a ticket. Permissions are controlled by role.

    Regular users may edit content fields (category, title, description,
    priority) of their own tickets but cannot change status or assignment.
    Staff may also update status; admins may additionally reassign tickets.
    """
    ticket = _get_ticket_or_404(db, ticket_id)
    if not _can_access_ticket(current_user, ticket):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this ticket",
        )

    old_status = ticket.status
    old_priority = ticket.priority
    old_content = {
        "category_id": ticket.category_id,
        "title": ticket.title,
        "description": ticket.description,
    }

    if current_user.role == "user":
        if payload.category_id is not None:
            _require_category(db, payload.category_id)
            ticket.category_id = payload.category_id
        if payload.title is not None:
            ticket.title = payload.title
        if payload.description is not None:
            ticket.description = payload.description
        if payload.priority is not None:
            ticket.priority = payload.priority
    else:
        if payload.category_id is not None:
            _require_category(db, payload.category_id)
            ticket.category_id = payload.category_id
        if payload.title is not None:
            ticket.title = payload.title
        if payload.description is not None:
            ticket.description = payload.description
        if payload.priority is not None:
            ticket.priority = payload.priority
        if payload.status is not None:
            ticket.status = payload.status
            if payload.status == "RESOLVED":
                ticket.resolved_at = ticket.resolved_at or utcnow()
            else:
                ticket.resolved_at = None
        if payload.assigned_to is not None and current_user.role == "admin":
            validate_assign_target(db, payload.assigned_to)
            previous_assignee = ticket.assigned_to
            ticket.assigned_to = payload.assigned_to
            if previous_assignee != ticket.assigned_to:
                log_activity(
                    activity_type="ticket_assigned",
                    performed_by=current_user,
                    ticket_id=ticket.ticket_id,
                    old_value={"assigned_to": previous_assignee},
                    new_value={"assigned_to": ticket.assigned_to},
                )

    db.commit()
    db.refresh(ticket)

    if ticket.status != old_status:
        log_activity(
            activity_type="ticket_resolved" if ticket.status == "RESOLVED" else "status_changed",
            performed_by=current_user,
            ticket_id=ticket.ticket_id,
            old_value={"status": old_status},
            new_value={"status": ticket.status, "resolved_at": ticket.resolved_at},
        )
    if ticket.priority != old_priority:
        log_activity(
            activity_type="priority_changed",
            performed_by=current_user,
            ticket_id=ticket.ticket_id,
            old_value={"priority": old_priority},
            new_value={"priority": ticket.priority},
        )
    new_content = {
        "category_id": ticket.category_id,
        "title": ticket.title,
        "description": ticket.description,
    }
    if new_content != old_content:
        log_activity(
            activity_type="ticket_updated",
            performed_by=current_user,
            ticket_id=ticket.ticket_id,
            old_value=old_content,
            new_value=new_content,
        )
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete/cancel a ticket when allowed.

    Regular users may only delete their own tickets while they are OPEN.
    Staff and admins may delete any ticket they can access.
    """
    ticket = _get_ticket_or_404(db, ticket_id)
    if not _can_access_ticket(current_user, ticket):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this ticket",
        )
    if current_user.role == "user" and ticket.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only OPEN tickets can be deleted",
        )

    service_delete_ticket(db, ticket, current_user)