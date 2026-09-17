"""FastAPI application entry point.

Wires together the application routers for the ITSupport backend and adds
safety-net exception handlers so database errors never leak internal
details to API clients.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from controllers.admin_controller import router as admin_router
from controllers.auth_controller import router as auth_router
from controllers.category_controller import router as category_router
from controllers.staff_controller import router as staff_router
from controllers.ticket_controller import router as ticket_router
from controllers.user_controller import router as user_router

logger = logging.getLogger("itsupport")

app = FastAPI(
    title="ITSupport",
    version="0.1.0",
    description="Backend API for the IT support ticketing system.",
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Map a DB constraint violation to a generic 409 conflict response."""
    logger.error("Integrity constraint violation on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=409,
        content={"detail": "Request conflicts with existing data"},
    )


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Catch remaining database errors and return a safe generic 500 response."""
    logger.error("Database error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(staff_router)
app.include_router(category_router)
app.include_router(ticket_router)
app.include_router(user_router)