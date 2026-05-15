"""Centralized exception handling for the FastAPI app."""

import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ValidationError(AppError):
    """Validation error."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=422)


class UnauthorizedError(AppError):
    """Authentication failed."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class AIServiceError(AppError):
    """AI service error (OpenAI, Pinecone, etc.)."""

    def __init__(self, message: str = "AI service temporarily unavailable"):
        super().__init__(message, status_code=503)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        logger.warning(f"AppError: {exc.message} (status={exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred. Please try again."},
        )
