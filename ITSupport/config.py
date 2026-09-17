"""Application configuration loaded from environment variables.

Database connection settings and secrets are read from environment
variables, which are populated from the local .env file by python-dotenv.
Every value is required; missing variables raise an error at import time.
No hardcoded defaults or fallback credentials are used.
"""

import os

from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection settings
POSTGRES_USER = os.environ["POSTGRES_USER"]
POSTGRES_PASSWORD = os.environ["POSTGRES_PASSWORD"]
POSTGRES_HOST = os.environ["POSTGRES_HOST"]
POSTGRES_PORT = os.environ["POSTGRES_PORT"]
POSTGRES_DB = os.environ["POSTGRES_DB"]

# MongoDB connection settings
MONGO_URI = os.environ["MONGO_URI"]
MONGO_DB = os.environ["MONGO_DB"]

# Authentication secret
JWT_SECRET = os.environ["JWT_SECRET"]