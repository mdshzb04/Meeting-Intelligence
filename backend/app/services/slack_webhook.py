"""Post messages to Slack incoming webhooks."""

import logging
import re

import httpx

logger = logging.getLogger(__name__)

SLACK_WEBHOOK_RE = re.compile(
    r"^https://hooks\.slack\.com/services/[A-Za-z0-9/_-]+$", re.I
)


def is_valid_slack_webhook(url: str) -> bool:
    return bool(url and SLACK_WEBHOOK_RE.match(url.strip()))


def _plural(count: int, singular: str, plural: str) -> str:
    return singular if count == 1 else plural


def format_meeting_complete_message(
    title: str,
    *,
    summary_generated: bool,
    action_items_count: int,
    decisions_count: int,
) -> str:
    """Rich Slack text when a meeting finishes processing (real counts only)."""
    lines = [f"📌 {title.strip()}", ""]

    if summary_generated:
        lines.append("✅ Summary generated")
    else:
        lines.append("⚠️ Summary not available")

    if action_items_count == 0:
        lines.append("📝 No action items extracted")
    else:
        lines.append(
            f"📝 {action_items_count} action "
            f"{_plural(action_items_count, 'item', 'items')} extracted"
        )

    if decisions_count == 0:
        lines.append("📍 No decisions detected")
    else:
        lines.append(
            f"📍 {decisions_count} "
            f"{_plural(decisions_count, 'decision', 'decisions')} detected"
        )

    lines.extend(["", "Meeting synced successfully with MeetingMind AI."])
    return "\n".join(lines)


async def send_slack_message(webhook_url: str, text: str) -> None:
    """Send a plain-text message to a Slack incoming webhook."""
    if not is_valid_slack_webhook(webhook_url):
        raise ValueError("Invalid Slack webhook URL")

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(webhook_url, json={"text": text})
        if res.status_code != 200:
            body = res.text[:200]
            logger.warning("Slack webhook failed: %s %s", res.status_code, body)
            raise RuntimeError(f"Slack returned {res.status_code}")
