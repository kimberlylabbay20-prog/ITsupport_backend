"""Service helpers for MongoDB access.

MongoDB stores flexible activity/history data for the ticketing system:
- ticket work notes (ticket_notes)
- activity records for important ticket and administrative actions
  (activity_logs)

PostgreSQL remains the primary store for users, categories, and tickets;
nothing here duplicates structured ticket data.
"""

from __future__ import annotations

from datetime import datetime, timezone

from pymongo.collection import Collection

from database.mongodb import db
from models.user import User

TICKET_NOTES_COLLECTION = "ticket_notes"
ACTIVITY_LOGS_COLLECTION = "activity_logs"

# Note activity types kept separate from the ticket table in PostgreSQL.
NOTE_TYPE_WORK = "work_note"
NOTE_TYPE_ADMIN = "admin_note"


def get_ticket_notes_collection() -> Collection:
    """Return the MongoDB collection used to store ticket work notes."""
    return db[TICKET_NOTES_COLLECTION]


def get_activity_logs_collection() -> Collection:
    """Return the MongoDB collection used to store activity records."""
    return db[ACTIVITY_LOGS_COLLECTION]


def _actor_info(user: User) -> dict:
    """Build a compact structured description of the acting user."""
    return {
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
    }


def add_ticket_note(
    *,
    ticket_id: int,
    message: str,
    performed_by: User,
    note_type: str,
) -> dict:
    """Store a work note/comment in MongoDB and return its record.

    Comments live only in MongoDB; nothing about them is written to the
    PostgreSQL ticket record.
    """
    now = datetime.now(timezone.utc)
    record = {
        "ticket_id": ticket_id,
        "activity_type": note_type,
        "message": message,
        "performed_by": _actor_info(performed_by),
        "author": performed_by.full_name or performed_by.username,
        "author_user_id": performed_by.user_id,
        "role": performed_by.role,
        "note": message,
        "timestamp": now,
        "created_at": now,
    }
    result = get_ticket_notes_collection().insert_one(record)
    return {
        "note_id": str(result.inserted_id),
        "ticket_id": ticket_id,
        "activity_type": note_type,
        "performed_by": record["performed_by"],
        "message": message,
        "note": message,
        "author": record["author"],
        "created_at": now,
    }


def list_ticket_notes(ticket_id: int) -> list[dict]:
    """Return the comments stored for a ticket, oldest first."""
    cursor = (
        get_ticket_notes_collection()
        .find({"ticket_id": ticket_id})
        .sort("created_at", 1)
    )
    return [
        {
            "note_id": str(doc["_id"]),
            "ticket_id": doc["ticket_id"],
            "activity_type": doc.get("activity_type"),
            "performed_by": doc.get("performed_by"),
            "message": doc.get("message"),
            "note": doc.get("note"),
            "author": doc.get("author"),
            "created_at": doc.get("created_at"),
        }
        for doc in cursor
    ]


def log_activity(
    *,
    activity_type: str,
    performed_by: User,
    ticket_id: int | None = None,
    old_value: object = None,
    new_value: object = None,
    **extra: object,
) -> str:
    """Write an activity record to MongoDB and return its id.

    The record carries the ticket id (when relevant), the activity type,
    who performed it, when it happened, and any old/new values.
    """
    record: dict = {
        "ticket_id": ticket_id,
        "activity_type": activity_type,
        "performed_by": _actor_info(performed_by),
        "timestamp": datetime.now(timezone.utc),
        "old_value": old_value,
        "new_value": new_value,
    }
    record.update(extra)
    result = get_activity_logs_collection().insert_one(record)
    return str(result.inserted_id)


def list_recent_activity(limit: int = 50) -> list[dict]:
    """Return the most recent ticket activity, merging notes and logs.

    Notes (ticket_notes) and general activity (activity_logs) are pulled
    separately from MongoDB, merged by timestamp, and trimmed to *limit*
    entries.  No PostgreSQL tables are touched.
    """
    _EPOCH = datetime.min.replace(tzinfo=timezone.utc)

    logs_cursor = (
        get_activity_logs_collection()
        .find({})
        .sort("timestamp", -1)
        .limit(limit)
    )
    logs = [
        {
            "activity_id": str(doc["_id"]),
            "activity_type": doc.get("activity_type"),
            "ticket_id": doc.get("ticket_id"),
            "performed_by": doc.get("performed_by"),
            "author": (doc.get("performed_by") or {}).get("username"),
            "message": None,
            "old_value": doc.get("old_value"),
            "new_value": doc.get("new_value"),
            "timestamp": doc.get("timestamp"),
        }
        for doc in logs_cursor
    ]

    notes_cursor = (
        get_ticket_notes_collection()
        .find({})
        .sort("created_at", -1)
        .limit(limit)
    )
    notes = [
        {
            "activity_id": str(doc["_id"]),
            "activity_type": doc.get("activity_type"),
            "ticket_id": doc.get("ticket_id"),
            "performed_by": doc.get("performed_by"),
            "author": doc.get("author"),
            "message": doc.get("message"),
            "old_value": None,
            "new_value": None,
            "timestamp": doc.get("created_at"),
        }
        for doc in notes_cursor
    ]

    merged = sorted(
        logs + notes, key=lambda r: r["timestamp"] or _EPOCH, reverse=True
    )
    return merged[:limit]