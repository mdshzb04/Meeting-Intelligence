"""User integrations — Slack webhook."""

import logging

from fastapi import APIRouter, Depends

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import ValidationError
from app.repositories import integrations as integrations_repo
from app.schemas.integrations import (
    SlackIntegrationResponse,
    SlackIntegrationUpdate,
    SlackTestResponse,
)
from app.services.slack_webhook import is_valid_slack_webhook, send_slack_message

logger = logging.getLogger(__name__)
router = APIRouter()


def _mask_url(url: str) -> str:
    if len(url) <= 24:
        return "••••••••"
    return url[:28] + "…" + url[-8:]


@router.get("/integrations/slack", response_model=SlackIntegrationResponse)
async def get_slack_integration(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    url = await integrations_repo.get_slack_webhook(pool, user["id"])
    return SlackIntegrationResponse(
        configured=bool(url),
        webhook_url_masked=_mask_url(url) if url else None,
    )


@router.put("/integrations/slack", response_model=SlackIntegrationResponse)
async def update_slack_integration(
    body: SlackIntegrationUpdate,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    url = (body.webhook_url or "").strip() or None
    if url and not is_valid_slack_webhook(url):
        raise ValidationError(
            "Invalid Slack webhook URL. Use an Incoming Webhook from your Slack app."
        )

    await integrations_repo.set_slack_webhook(pool, user["id"], url)
    logger.info("Slack webhook updated", extra={"user_id": user["id"], "configured": bool(url)})

    return SlackIntegrationResponse(
        configured=bool(url),
        webhook_url_masked=_mask_url(url) if url else None,
    )


@router.post("/integrations/slack/test", response_model=SlackTestResponse)
async def test_slack_integration(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    url = await integrations_repo.get_slack_webhook(pool, user["id"])
    if not url:
        raise ValidationError("No Slack webhook configured")

    await send_slack_message(
        url,
        f"MeetingMind test — hi {user['name']}! Your Slack integration is working.",
    )
    return SlackTestResponse(message="Test message sent to Slack")
