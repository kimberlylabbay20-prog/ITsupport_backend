"""Staff controller with staff ticket-handling endpoints.

Routes (physically defined here):
- GET   /staff/tickets                  list tickets assigned to the staff member
- GET   /staff/tickets/{ticket_id}      view an assigned ticket
- PATCH /staff/tickets/{ticket_id}/status   update the status of an assigned ticket
- PATCH /staff/tickets/{ticket_id}/priority update the priority of an assigned ticket
- POST  /staff/tickets/{ticket_id}/notes    add a work note/comment

Access control: staff (and admin) only, via JWT. Staff cannot assign
tickets to themselves/others, manage users, categories, admins, or access
admin-only functions here.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.postgres import get_db
from models.ticket import Ticket
from models.user import User
from schemas.ticket_schema import (
    TicketPriorityUpdate,
    TicketResponse,
    TicketStatusUpdate,
    WorkNoteRequest,
    WorkNoteResponse,
)
from services.auth_service import require_staff
from services.ticket_service import (
    add_work_note,
    get_assigned_ticket,
    list_assigned_tickets,
    set_ticket_priority,
    set_ticket_status,
)

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/tickets", response_model=list[TicketResponse])
def staff_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
) -> list[Ticket]:
    """List the tickets assigned to the current staff member."""
    return list_assigned_tickets(db, current_user)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def staff_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
) -> Ticket:
    """View a ticket assigned to the current staff member."""
    return get_assigned_ticket(db, ticket_id, current_user)


@router.patch("/tickets/{ticket_id}/status", response_model=TicketResponse)
def staff_update_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
) -> Ticket:
    """Update the status of an assigned ticket."""
    ticket = get_assigned_ticket(db, ticket_id, current_user)
    return set_ticket_status(db, ticket, payload.status, current_user)


@router.patch("/tickets/{ticket_id}/priority", response_model=TicketResponse)
def staff_update_priority(
    ticket_id: int,
    payload: TicketPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
) -> Ticket:
    """Update the priority of an assigned ticket (valid values only)."""
    ticket = get_assigned_ticket(db, ticket_id, current_user)
    return set_ticket_priority(db, ticket, payload.priority, current_user)


@router.post(
    "/tickets/{ticket_id}/notes",
    response_model=WorkNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def staff_add_note(
    ticket_id: int,
    payload: WorkNoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Add a work note to an assigned ticket (persisted via the service layer)."""
    ticket = get_assigned_ticket(db, ticket_id, current_user)
    return add_work_note(ticket, current_user, payload.text)