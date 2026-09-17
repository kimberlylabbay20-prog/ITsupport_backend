"""Admin controller with ticket-management endpoints.

Routes (physically defined here):
- GET    /admin/dashboard                  aggregate ticket statistics
- GET    /admin/reports                     grouped system-wide reports
- GET    /admin/tickets                     list all tickets
- GET    /admin/tickets/{ticket_id}         view any ticket
- PUT    /admin/tickets/{ticket_id}/status  update the status of any ticket
- PUT    /admin/tickets/{ticket_id}/priority update the priority of any ticket
- PUT    /admin/tickets/{ticket_id}/assign  assign a ticket to a staff user
- PUT    /admin/tickets/{ticket_id}/resolve mark a ticket resolved
- POST   /admin/tickets/{ticket_id}/notes   add an administrative note

Access control: strict admin only (via JWT + require_admin). Regular users
and staff are rejected with 403. Assignment is the exclusive capability of
admin and validates that the target user has the staff role.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.postgres import get_db
from models.ticket import Ticket
from models.user import User
from schemas.dashboard_schema import DashboardStats
from schemas.report_schema import AdminReport
from schemas.activity_schema import ActivityResponse
from schemas.ticket_schema import (
    TicketAssignRequest,
    TicketPriorityUpdate,
    TicketResponse,
    TicketStatusUpdate,
    WorkNoteRequest,
    WorkNoteResponse,
)
from services.auth_service import require_admin
from services.dashboard_service import get_dashboard_stats
from services.report_service import get_admin_report
from services.mongo_service import list_recent_activity
from services.ticket_service import (
    add_admin_note,
    assign_ticket,
    get_any_ticket,
    list_all_tickets,
    resolve_ticket,
    set_ticket_priority,
    set_ticket_status,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Return aggregate ticket statistics (admin dashboard)."""
    return get_dashboard_stats(db)


@router.get("/reports", response_model=AdminReport)
def admin_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Return system-wide grouped ticket reports (admin only)."""
    return get_admin_report(db)


@router.get("/activity", response_model=list[ActivityResponse])
def admin_activity(
    current_user: User = Depends(require_admin),
) -> list[dict]:
    """Return the most recent ticket activity and history (admin only)."""
    return list_recent_activity()


@router.get("/tickets", response_model=list[TicketResponse])
def admin_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[Ticket]:
    """List all tickets in the system."""
    return list_all_tickets(db)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def admin_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    """View any ticket regardless of assignment."""
    return get_any_ticket(db, ticket_id)


@router.put("/tickets/{ticket_id}/status", response_model=TicketResponse)
def admin_update_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    """Update the status of any ticket."""
    ticket = get_any_ticket(db, ticket_id)
    return set_ticket_status(db, ticket, payload.status, current_user)


@router.put("/tickets/{ticket_id}/priority", response_model=TicketResponse)
def admin_update_priority(
    ticket_id: int,
    payload: TicketPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    """Update the priority of any ticket."""
    ticket = get_any_ticket(db, ticket_id)
    return set_ticket_priority(db, ticket, payload.priority, current_user)


@router.put("/tickets/{ticket_id}/assign", response_model=TicketResponse)
def admin_assign_ticket(
    ticket_id: int,
    payload: TicketAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    """Assign a ticket to a staff user (staff role is required)."""
    ticket = get_any_ticket(db, ticket_id)
    return assign_ticket(db, ticket, payload.assigned_to, current_user)


@router.put("/tickets/{ticket_id}/resolve", response_model=TicketResponse)
def admin_resolve_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    """Resolve any ticket (sets status to RESOLVED with resolved_at)."""
    ticket = get_any_ticket(db, ticket_id)
    return resolve_ticket(db, ticket, current_user)


@router.post(
    "/tickets/{ticket_id}/notes",
    response_model=WorkNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_add_note(
    ticket_id: int,
    payload: WorkNoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> WorkNoteResponse:
    """Add an administrative note to any ticket (admin only)."""
    ticket = get_any_ticket(db, ticket_id)
    return add_admin_note(ticket, current_user, payload.text)