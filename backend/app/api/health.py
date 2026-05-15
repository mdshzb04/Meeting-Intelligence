"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check for Render deployment monitoring."""
    return {"status": "healthy", "service": "meeting-intel-api"}
