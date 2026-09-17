"""PostgreSQL database engine and session management using SQLAlchemy.

Connection settings are read from config.py (which pulls them from the
environment/.env). No credentials or database URLs are hardcoded here.
"""

from collections.abc import Generator
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import config


def get_database_url() -> str:
    """Build the SQLAlchemy URL from environment-based configuration."""
    credentials = quote_plus(config.POSTGRES_USER) + ":" + quote_plus(config.POSTGRES_PASSWORD)
    return (
        f"postgresql+psycopg2://{credentials}"
        f"@{config.POSTGRES_HOST}:{config.POSTGRES_PORT}/{config.POSTGRES_DB}"
    )


engine = create_engine(
    get_database_url(),
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()