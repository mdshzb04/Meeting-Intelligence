"""Resend transactional email service.

Design principles:
- Fire-and-forget: always called with asyncio.create_task(); never blocks an API response.
- Graceful degradation: if RESEND_API_KEY is absent, logs a debug message and exits silently.
- No duplicate logic: each email type has a single builder function + one send call.
- Retry-safe: Resend's SDK is idempotent on the caller side; no extra retry loop needed.
"""

import asyncio
import logging
from typing import Optional
import resend

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_api_key() -> Optional[str]:
    """Return the Resend API key from settings, or None if unconfigured."""
    try:
        from app.config import get_settings
        key = getattr(get_settings(), "RESEND_API_KEY", None)
        return key if key and key.strip() else None
    except Exception:
        return None


def _get_from_address() -> str:
    """Return the sender address from settings with a safe fallback."""
    try:
        from app.config import get_settings
        addr = getattr(get_settings(), "EMAIL_FROM", None)
        if addr and addr.strip():
            return addr.strip()
    except Exception:
        pass
    return "MeetingMind <onboarding@resend.dev>"


def _send_email_sync(*, to: str, subject: str, html: str) -> None:
    """Blocking Resend send — runs inside asyncio.to_thread() so the event loop stays free."""
    api_key = _get_api_key()
    if not api_key:
        logger.debug("RESEND_API_KEY not set — skipping email to %s", to)
        return

    resend.api_key = api_key
    try:
        resend.Emails.send({
            "from": _get_from_address(),
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent: subject=%r to=%s", subject, to)
    except Exception as exc:
        logger.warning("Email send failed: subject=%r to=%s error=%s", subject, to, exc)


async def _send(*, to: str, subject: str, html: str) -> None:
    """Async wrapper — offloads blocking I/O to a thread pool."""
    await asyncio.to_thread(_send_email_sync, to=to, subject=subject, html=html)


# ---------------------------------------------------------------------------
# Public fire-and-forget entry point
# ---------------------------------------------------------------------------

def schedule_email(*, to: str, subject: str, html: str) -> None:
    """Queue an email as a background asyncio task — never raises, never blocks.

    Usage:
        schedule_email(to=user_email, subject="...", html="...")
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_send(to=to, subject=subject, html=html))
    except RuntimeError:
        # No running loop (e.g. called from a sync context in tests)
        logger.debug("No running event loop — skipping email to %s", to)


# ---------------------------------------------------------------------------
# Email builders
# ---------------------------------------------------------------------------

def _base_html(title: str, body_html: str) -> str:
    """Minimal, inline-styled HTML shell that renders well across email clients."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #1e1e1e;">
              <span style="font-size:18px;font-weight:600;color:#fff;letter-spacing:-0.3px;">
                Meeting<span style="color:#7c3aed;">Mind</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;color:#d4d4d4;font-size:15px;line-height:1.65;">
              {body_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1e1e1e;
                       font-size:12px;color:#555;text-align:center;">
              MeetingMind AI &mdash; you received this because you have an account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# --- 1. Meeting processing completed ---

def send_meeting_processed_email(
    *,
    to: str,
    user_name: str,
    meeting_title: str,
    summary_snippet: str,
    action_items_count: int,
    decisions_count: int,
    meeting_url: str = "",
) -> None:
    """Fire-and-forget email: meeting AI analysis is done."""
    subject = f"✅ \"{meeting_title}\" is ready"
    action_line = (
        f"{action_items_count} action item{'s' if action_items_count != 1 else ''}"
        if action_items_count else "No action items"
    )
    decision_line = (
        f"{decisions_count} decision{'s' if decisions_count != 1 else ''} detected"
        if decisions_count else "No decisions detected"
    )
    cta = (
        f'<p style="margin:24px 0 0;"><a href="{meeting_url}" '
        f'style="background:#7c3aed;color:#fff;padding:10px 22px;border-radius:6px;'
        f'text-decoration:none;font-size:14px;font-weight:500;">View Meeting</a></p>'
        if meeting_url else ""
    )
    body = f"""
<p style="margin:0 0 6px;font-size:22px;font-weight:600;color:#fff;">
  Your meeting is ready
</p>
<p style="margin:0 0 24px;color:#888;font-size:14px;">Hi {user_name},</p>
<p style="margin:0 0 16px;">
  <strong style="color:#fff;">{meeting_title}</strong> has been processed by MeetingMind AI.
</p>
<div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
  <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Summary</p>
  <p style="margin:0;color:#d4d4d4;">{summary_snippet or 'Summary generated — open the meeting to read it.'}</p>
</div>
<table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
  <tr>
    <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;
               width:48%;font-size:13px;color:#a3a3a3;">
      📝 {action_line}
    </td>
    <td style="width:4%;"></td>
    <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;
               width:48%;font-size:13px;color:#a3a3a3;">
      📍 {decision_line}
    </td>
  </tr>
</table>
{cta}
"""
    schedule_email(to=to, subject=subject, html=_base_html(subject, body))


# --- 2. Transcript ready ---

def send_transcript_ready_email(
    *,
    to: str,
    user_name: str,
    meeting_title: str,
    meeting_url: str = "",
) -> None:
    """Fire-and-forget email: raw transcript is now available."""
    subject = f"📄 Transcript ready for \"{meeting_title}\""
    cta = (
        f'<p style="margin:24px 0 0;"><a href="{meeting_url}" '
        f'style="background:#7c3aed;color:#fff;padding:10px 22px;border-radius:6px;'
        f'text-decoration:none;font-size:14px;font-weight:500;">View Transcript</a></p>'
        if meeting_url else ""
    )
    body = f"""
<p style="margin:0 0 6px;font-size:22px;font-weight:600;color:#fff;">Transcript ready</p>
<p style="margin:0 0 24px;color:#888;font-size:14px;">Hi {user_name},</p>
<p style="margin:0 0 16px;">
  The transcript for <strong style="color:#fff;">{meeting_title}</strong>
  is now available in MeetingMind.
</p>
<p style="margin:0;color:#a3a3a3;font-size:14px;">
  AI analysis may still be in progress — you&apos;ll receive another email once it&apos;s complete.
</p>
{cta}
"""
    schedule_email(to=to, subject=subject, html=_base_html(subject, body))


# --- 3. Meeting shared ---

def send_meeting_shared_email(
    *,
    to: str,
    recipient_name: str,
    sender_name: str,
    meeting_title: str,
    meeting_url: str = "",
) -> None:
    """Fire-and-forget email: someone shared a meeting with the recipient."""
    subject = f"{sender_name} shared \"{meeting_title}\" with you"
    cta = (
        f'<p style="margin:24px 0 0;"><a href="{meeting_url}" '
        f'style="background:#7c3aed;color:#fff;padding:10px 22px;border-radius:6px;'
        f'text-decoration:none;font-size:14px;font-weight:500;">Open Meeting</a></p>'
        if meeting_url else ""
    )
    body = f"""
<p style="margin:0 0 6px;font-size:22px;font-weight:600;color:#fff;">Meeting shared with you</p>
<p style="margin:0 0 24px;color:#888;font-size:14px;">Hi {recipient_name},</p>
<p style="margin:0 0 16px;">
  <strong style="color:#fff;">{sender_name}</strong> shared a meeting with you on MeetingMind:
</p>
<div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
  <p style="margin:0;font-size:16px;font-weight:500;color:#fff;">{meeting_title}</p>
</div>
{cta}
"""
    schedule_email(to=to, subject=subject, html=_base_html(subject, body))


# --- 4. Workspace invitation ---

def send_workspace_invitation_email(
    *,
    to: str,
    inviter_name: str,
    workspace_name: str,
    invite_url: str = "",
) -> None:
    """Fire-and-forget email: workspace invite."""
    subject = f"You're invited to join {workspace_name} on MeetingMind"
    cta = (
        f'<p style="margin:24px 0 0;"><a href="{invite_url}" '
        f'style="background:#7c3aed;color:#fff;padding:10px 22px;border-radius:6px;'
        f'text-decoration:none;font-size:14px;font-weight:500;">Accept Invitation</a></p>'
        if invite_url else ""
    )
    body = f"""
<p style="margin:0 0 6px;font-size:22px;font-weight:600;color:#fff;">You&apos;re invited</p>
<p style="margin:0 0 24px;color:#888;font-size:14px;">Hello,</p>
<p style="margin:0 0 16px;">
  <strong style="color:#fff;">{inviter_name}</strong> has invited you to join the
  <strong style="color:#fff;">{workspace_name}</strong> workspace on MeetingMind.
</p>
<p style="margin:0 0 20px;color:#a3a3a3;font-size:14px;">
  MeetingMind uses AI to turn your meetings into structured summaries, action items, and searchable transcripts.
</p>
{cta}
<p style="margin:20px 0 0;font-size:12px;color:#555;">
  If you weren&apos;t expecting this, you can safely ignore it.
</p>
"""
    schedule_email(to=to, subject=subject, html=_base_html(subject, body))


# --- 5. Welcome email (on registration) ---

def send_welcome_email(*, to: str, user_name: str) -> None:
    """Fire-and-forget welcome email sent immediately after registration."""
    subject = "Welcome to MeetingMind 👋"
    body = f"""
<p style="margin:0 0 6px;font-size:22px;font-weight:600;color:#fff;">Welcome, {user_name}!</p>
<p style="margin:0 0 24px;color:#888;font-size:14px;">Your account is ready.</p>
<p style="margin:0 0 16px;">
  MeetingMind turns your meetings into structured summaries, action items, decisions,
  and a searchable knowledge base — powered by AI.
</p>
<p style="margin:0 0 20px;font-size:14px;color:#a3a3a3;">Here&apos;s how to get started:</p>
<table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
  <tr>
    <td style="padding:12px 16px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;">
      <span style="font-size:13px;color:#7c3aed;font-weight:600;">1.</span>
      <span style="font-size:13px;color:#d4d4d4;margin-left:8px;">
        Paste a meeting transcript or upload an audio recording
      </span>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:12px 16px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;">
      <span style="font-size:13px;color:#7c3aed;font-weight:600;">2.</span>
      <span style="font-size:13px;color:#d4d4d4;margin-left:8px;">
        AI generates a summary, action items, and decisions automatically
      </span>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:12px 16px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;">
      <span style="font-size:13px;color:#7c3aed;font-weight:600;">3.</span>
      <span style="font-size:13px;color:#d4d4d4;margin-left:8px;">
        Chat with your meeting history using the AI assistant
      </span>
    </td>
  </tr>
</table>
<p style="margin:0;font-size:14px;color:#a3a3a3;">
  If you have any questions, just reply to this email.
</p>
"""
    schedule_email(to=to, subject=subject, html=_base_html(subject, body))
