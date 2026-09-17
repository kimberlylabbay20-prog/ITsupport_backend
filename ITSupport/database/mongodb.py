"""MongoDB client and database access using PyMongo.

Connection settings are read from config.py (which pulls them from the
environment/.env). No credentials or URIs are hardcoded here.
"""

from pymongo import MongoClient
from pymongo.database import Database

import config

client = MongoClient(config.MONGO_URI)

db: Database = client[config.MONGO_DB]


def get_database() -> Database:
    """Return the configured MongoDB database for reuse across services."""
    return db