"""Observability integration status."""

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.deps.auth import get_current_user
from app.services.traceplane_client import is_enabled

router = APIRouter()


@router.get("/integrations/traceplane")
async def get_traceplane_integration(user: dict = Depends(get_current_user)):
    settings = get_settings()
    configured = bool(settings.TRACEPLANE_API_KEY) and is_enabled()
    return {
        "configured": configured,
        "base_url": settings.TRACEPLANE_BASE_URL,
        "dashboard_url": settings.TRACEPLANE_BASE_URL.replace("/api/v1", ""),
    }
