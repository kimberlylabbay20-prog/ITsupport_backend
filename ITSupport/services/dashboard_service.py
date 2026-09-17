"""Dashboard aggregate statistics (service layer).

Computes summary counts from the PostgreSQL ticket table for the
admin dashboard endpoint.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.ticket import Ticket

OPEN_STATUS = "OPEN"
IN_PROGRESS_STATUS = "IN_PROGRESS"
RESOLVED_STATUS = "RESOLVED"
CLOSED_STATUS = "CLOSED"

HIGH_PRIORITY = "HIGH"
CRITICAL_PRIORITY = "CRITICAL"


def get_dashboard_stats(db: Session) -> dict:
    """Return aggregate ticket statistics from PostgreSQL.

    high_priority counts tickets with HIGH or CRITICAL priority.
    """
    total = db.query(func.count(Ticket.ticket_id)).scalar() or 0

    status_rows = (
        db.query(Ticket.status, func.count(Ticket.ticket_id))
        .group_by(Ticket.status)
        .all()
    )
    priority_rows = (
        db.query(Ticket.priority, func.count(Ticket.ticket_id))
        .group_by(Ticket.priority)
        .all()
    )

    status_counts = {status: count for status, count in status_rows}
    priority_counts = {priority: count for priority, count in priority_rows}

    return {
        "total_tickets": total,
        "open_tickets": status_counts.get(OPEN_STATUS, 0),
        "in_progress": status_counts.get(IN_PROGRESS_STATUS, 0),
        "resolved_tickets": status_counts.get(RESOLVED_STATUS, 0),
        "closed_tickets": status_counts.get(CLOSED_STATUS, 0),
        "high_priority": priority_counts.get(HIGH_PRIORITY, 0)
        + priority_counts.get(CRITICAL_PRIORITY, 0),
        "by_status": status_counts,
        "by_priority": priority_counts,
    }