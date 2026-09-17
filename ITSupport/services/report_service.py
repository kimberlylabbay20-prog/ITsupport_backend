"""System-wide report aggregates (service layer).

Computes grouped counts from PostgreSQL for the admin reports endpoint.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.category import Category
from models.ticket import Ticket
from models.user import User

STATUSES = ("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED")
PRIORITIES = ("LOW", "MEDIUM", "HIGH", "CRITICAL")
UNASSIGNED_LABEL = "unassigned"


def get_admin_report(db: Session) -> dict:
    """Return category/status/priority/staff ticket aggregates."""
    by_category = dict(
        db.query(Category.name, func.count(Ticket.ticket_id))
        .outerjoin(Ticket, Ticket.category_id == Category.category_id)
        .group_by(Category.name)
        .order_by(Category.name.asc())
        .all()
    )

    by_status = dict(
        db.query(Ticket.status, func.count(Ticket.ticket_id))
        .group_by(Ticket.status)
        .all()
    )
    for status in STATUSES:
        by_status.setdefault(status, 0)

    by_priority = dict(
        db.query(Ticket.priority, func.count(Ticket.ticket_id))
        .group_by(Ticket.priority)
        .all()
    )
    for priority in PRIORITIES:
        by_priority.setdefault(priority, 0)

    by_staff = dict(
        db.query(User.username, func.count(Ticket.ticket_id))
        .join(Ticket, Ticket.assigned_to == User.user_id)
        .group_by(User.username)
        .all()
    )
    unassigned = (
        db.query(func.count(Ticket.ticket_id))
        .filter(Ticket.assigned_to.is_(None))
        .scalar()
        or 0
    )
    by_staff[UNASSIGNED_LABEL] = unassigned

    total_open = (
        db.query(func.count(Ticket.ticket_id))
        .filter(Ticket.status == "OPEN")
        .scalar()
        or 0
    )
    total_resolved = (
        db.query(func.count(Ticket.ticket_id))
        .filter(Ticket.status == "RESOLVED")
        .scalar()
        or 0
    )

    return {
        "tickets_by_category": by_category,
        "tickets_by_status": by_status,
        "tickets_by_priority": by_priority,
        "tickets_by_assigned_staff": by_staff,
        "total_open_tickets": total_open,
        "total_resolved_tickets": total_resolved,
    }