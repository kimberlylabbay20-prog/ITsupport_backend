"""Docker-only database initialization.

Creates the PostgreSQL tables from the existing SQLAlchemy models and
seeds the default support categories when they are missing.

This is safe to run more than once:

- table creation uses Base.metadata.create_all (checkfirst), so existing
  tables are left untouched and no data is dropped;
- category seeding skips names that already exist, so no duplicates are
  created;
- no user accounts, tickets, or activity records are created.

This script is only invoked by the Docker "db-init" service. It does not
change any application route or service behavior.
"""

from database.base import Base
from database.postgres import SessionLocal, engine
from models import Category  # noqa: F401  (registers all ORM models)

DEFAULT_CATEGORIES = [
    "Network",
    "Hardware",
    "Software",
    "Account",
    "Internet",
    "Printer",
    "Email",
    "Other",
]


def initialize_database() -> None:
    """Create tables if missing and ensure the default categories exist."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for name in DEFAULT_CATEGORIES:
            exists = db.query(Category).filter(Category.name == name).first()
            if exists is None:
                db.add(Category(name=name))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    initialize_database()
    print("Database initialization complete: tables ready and default categories ensured.")