"""Database operations for chat messages."""

import json
import asyncpg
from typing import List, Optional


async def create_message(
    pool: asyncpg.Pool,
    meeting_id: str,
    role: str,
    content: str,
    citations: Optional[List[dict]] = None,
) -> dict:
    """Store a chat message with optional citations."""
    citations_json = json.dumps(citations or [])

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO chat_messages (meeting_id, role, content, citations)
            VALUES ($1::uuid, $2, $3, $4::jsonb)
            RETURNING id, meeting_id, role, content, citations, created_at
            """,
            meeting_id,
            role,
            content,
            citations_json,
        )
        result = dict(row)
        if isinstance(result.get("citations"), str):
            result["citations"] = json.loads(result["citations"])
        return result


async def get_messages(
    pool: asyncpg.Pool, meeting_id: str, limit: int = 50
) -> List[dict]:
    """Get chat history for a meeting, ordered chronologically."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, meeting_id, role, content, citations, created_at
            FROM chat_messages
            WHERE meeting_id = $1::uuid
            ORDER BY created_at ASC
            LIMIT $2
            """,
            meeting_id,
            limit,
        )
        results = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get("citations"), str):
                d["citations"] = json.loads(d["citations"])
            elif d.get("citations") is None:
                d["citations"] = []
            results.append(d)
        return results


async def get_recent_messages(
    pool: asyncpg.Pool, meeting_id: str, limit: int = 10
) -> List[dict]:
    """Get the most recent messages for context window."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, meeting_id, role, content, citations, created_at
            FROM chat_messages
            WHERE meeting_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT $2
            """,
            meeting_id,
            limit,
        )
        results = []
        for r in reversed(rows):
            d = dict(r)
            if isinstance(d.get("citations"), str):
                d["citations"] = json.loads(d["citations"])
            elif d.get("citations") is None:
                d["citations"] = []
            results.append(d)
        return results
