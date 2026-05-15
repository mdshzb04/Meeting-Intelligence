"""RAG chat with full workspace memory and citations."""

import json
import logging
from typing import List, Tuple
from openai import OpenAI

import asyncpg

from app.config import get_settings
from app.exceptions import AIServiceError
from app.services.memory_context import build_memory_context

logger = logging.getLogger(__name__)

MEMORY_SYSTEM_PROMPT = """You are MeetingMind, an AI assistant with memory of every completed meeting: transcripts, action items, decisions, and summaries.

RULES:
1. Answer using ONLY the numbered sources in MEMORY CONTEXT below.
2. When the user asks about a meeting by name (e.g. "u7"), use sources for that meeting title.
3. Cite sources inline using [1], [2], etc. matching the source numbers.
4. If sources lack enough information, say what is missing — do not invent facts.
5. Be concise and professional. Quote transcript excerpts when helpful.

MEMORY CONTEXT:
{context}

Respond with valid JSON only:
{{
  "answer": "Your answer with [1] style citations inline",
  "citation_refs": [1, 2]
}}

citation_refs must list every source number you cited in the answer (integers)."""


async def chat_with_memory(
    pool: asyncpg.Pool,
    user_id: str,
    meeting_id: str,
    meeting_title: str,
    user_query: str,
    chat_history: List[dict],
) -> Tuple[str, List[dict]]:
    """RAG chat across all meetings. Returns (answer_text, citations)."""
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        context, sources = await build_memory_context(
            pool, user_id, meeting_id, meeting_title, user_query
        )

        if not sources:
            return (
                "No meeting memory is available yet. Complete at least one meeting "
                "with a transcript to enable chat.",
                [],
            )

        system_prompt = MEMORY_SYSTEM_PROMPT.format(context=context)
        messages = [{"role": "system", "content": system_prompt}]

        for msg in chat_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_query})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )

        raw = response.choices[0].message.content
        parsed = json.loads(raw)
        answer = parsed.get("answer", "").strip()
        refs = parsed.get("citation_refs", [])

        ref_set = set()
        for r in refs:
            try:
                ref_set.add(int(r))
            except (TypeError, ValueError):
                continue
        citations = []
        for src in sources:
            if int(src["ref"]) in ref_set:
                citations.append({
                    "meeting_id": src["meeting_id"],
                    "meeting_title": src["meeting_title"],
                    "source_type": src["source_type"],
                    "excerpt": src["excerpt"],
                    "label": src["label"],
                    "ref": src["ref"],
                })

        if not answer:
            answer = "I couldn't generate an answer from the available meeting memory."

        logger.info(
            f"Memory chat for {meeting_id}: {len(citations)} citations, "
            f"{len(sources)} sources"
        )
        return answer, citations

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse chat JSON: {e}")
        raise AIServiceError("Failed to parse chat response")
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Memory chat failed: {e}")
        raise AIServiceError(f"Chat failed: {str(e)}")


# Backwards-compatible alias
async def chat_with_meeting(
    meeting_id: str,
    user_query: str,
    chat_history: List[dict],
    pool: asyncpg.Pool | None = None,
    meeting_title: str = "Meeting",
) -> str:
    if pool is None:
        raise AIServiceError("Database pool required for memory chat")
    answer, _ = await chat_with_memory(
        pool, "", meeting_id, meeting_title, user_query, chat_history
    )
    return answer
