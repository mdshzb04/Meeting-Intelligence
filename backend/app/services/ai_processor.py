"""OpenAI GPT service for meeting analysis and structured extraction."""

import json
import logging
from openai import OpenAI

from app.config import get_settings
from app.exceptions import AIServiceError
from app.services.traceplane_client import traced, record_chat_usage

logger = logging.getLogger(__name__)

ANALYSIS_SYSTEM_PROMPT = """You are an expert meeting analyst. Analyze the provided meeting transcript and extract structured information.

You MUST respond with valid JSON in exactly this format:
{
    "summary": "A comprehensive but concise summary of the meeting (2-4 paragraphs)",
    "highlights": "Key highlights and important moments from the meeting, as a bullet-point list using markdown",
    "next_steps": "Concise next steps agreed upon, as a bullet-point list using markdown",
    "action_items": [
        {
            "title": "Clear, actionable task title",
            "description": "Brief description of what needs to be done",
            "priority": "high|medium|low"
        }
    ],
    "decisions": [
        {
            "decision_text": "The decision that was made",
            "notes": "Any context or reasoning behind the decision"
        }
    ]
}

Rules:
- Extract ALL action items mentioned, even implied ones
- Extract ALL decisions, including implicit agreements
- Priority should be based on urgency and importance mentioned in context
- Keep the summary professional and comprehensive
- Use markdown formatting in highlights and next_steps
- If no action items or decisions are found, return empty arrays
- Always return valid JSON"""


def _coerce_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(str(item) for item in value)
    return str(value)


def _coerce_markdown_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        lines = []
        for item in value:
            text = str(item).strip()
            if not text:
                continue
            lines.append(text if text.startswith("-") else f"- {text}")
        return "\n".join(lines)
    return str(value)


async def analyze_meeting(transcript: str) -> dict:
    """Analyze a meeting transcript and extract structured data.

    Returns dict with: summary, highlights, next_steps, action_items, decisions
    """
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # Truncate very long transcripts to stay within token limits
        max_chars = 100000  # ~25k tokens
        truncated = transcript[:max_chars]
        if len(transcript) > max_chars:
            truncated += "\n\n[Transcript truncated due to length]"

        logger.info(f"Analyzing meeting transcript ({len(truncated)} chars)")

        with traced("meeting-analyzer", model="gpt-4o-mini") as span:
            span.set_input(truncated[:2000])
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Analyze this meeting transcript:\n\n{truncated}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=4000,
            )
            result_text = response.choices[0].message.content
            record_chat_usage(span, response, "gpt-4o-mini")
            span.set_output((result_text or "")[:2000])
        result = json.loads(result_text)

        # Validate expected fields
        required_fields = ["summary", "highlights", "next_steps", "action_items", "decisions"]
        for field in required_fields:
            if field not in result:
                result[field] = [] if field in ("action_items", "decisions") else ""

        # GPT sometimes returns bullet lists as arrays; DB columns expect text
        result["summary"] = _coerce_text(result.get("summary"))
        result["highlights"] = _coerce_markdown_text(result.get("highlights"))
        result["next_steps"] = _coerce_markdown_text(result.get("next_steps"))

        logger.info(
            f"Analysis complete: {len(result.get('action_items', []))} action items, "
            f"{len(result.get('decisions', []))} decisions"
        )
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        raise AIServiceError("Failed to parse meeting analysis results")
    except Exception as e:
        logger.error(f"Meeting analysis failed: {e}")
        raise AIServiceError(f"Meeting analysis failed: {str(e)}")


def generate_meeting_title(transcript: str) -> str:
    """Generate a short meeting title from the first few lines of the transcript."""
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # Use just the first 500 chars for title generation
        snippet = transcript[:500]

        with traced("meeting-title-generator", model="gpt-4o-mini") as span:
            span.set_input(snippet)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a short, descriptive meeting title (max 8 words) based on the transcript snippet. Return ONLY the title text, no quotes or punctuation.",
                    },
                    {"role": "user", "content": snippet},
                ],
                temperature=0.5,
                max_tokens=30,
            )
            title = response.choices[0].message.content.strip().strip('"').strip("'")
            record_chat_usage(span, response, "gpt-4o-mini")
            span.set_output(title)
        return title[:255]  # Ensure it fits DB column

    except Exception as e:
        logger.warning(f"Title generation failed, using fallback: {e}")
        return "Meeting Notes"
