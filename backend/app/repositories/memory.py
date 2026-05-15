"""Workspace memory scoped per user."""

import asyncpg
from typing import List, Optional


async def get_completed_meeting_ids(pool: asyncpg.Pool, user_id: str) -> List[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text FROM meetings
            WHERE user_id = $1::uuid AND status = 'completed'
            ORDER BY created_at DESC
            """,
            user_id,
        )
        return [r["id"] for r in rows]


async def get_meeting_titles(pool: asyncpg.Pool, user_id: str) -> dict[str, str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS id, title FROM meetings
            WHERE user_id = $1::uuid AND status = 'completed'
            """,
            user_id,
        )
        return {r["id"]: r["title"] for r in rows}


async def get_workspace_memory(
    pool: asyncpg.Pool,
    user_id: str,
    focus_meeting_id: Optional[str] = None,
    query: Optional[str] = None,
) -> dict:
    async with pool.acquire() as conn:
        meetings = await conn.fetch(
            """
            SELECT id::text AS id, title, summary, highlights, next_steps, created_at
            FROM meetings
            WHERE user_id = $1::uuid AND status = 'completed'
            ORDER BY created_at DESC
            """,
            user_id,
        )

        tasks = await conn.fetch(
            """
            SELECT t.id::text AS id, t.meeting_id::text AS meeting_id, m.title AS meeting_title,
                   t.title, t.description, t.status, t.priority
            FROM tasks t
            JOIN meetings m ON m.id = t.meeting_id
            WHERE m.user_id = $1::uuid AND m.status = 'completed'
            ORDER BY m.created_at DESC, t.created_at ASC
            """,
            user_id,
        )

        decisions = await conn.fetch(
            """
            SELECT d.id::text AS id, d.meeting_id::text AS meeting_id, m.title AS meeting_title,
                   d.decision_text, d.notes, d.implementation_status
            FROM decisions d
            JOIN meetings m ON m.id = d.meeting_id
            WHERE m.user_id = $1::uuid AND m.status = 'completed'
            ORDER BY m.created_at DESC, d.created_at ASC
            """,
            user_id,
        )

    meetings_list = [dict(m) for m in meetings]
    tasks_list = [dict(t) for t in tasks]
    decisions_list = [dict(d) for d in decisions]

    if query:
        q = query.lower()

        def matches(text: Optional[str]) -> bool:
            if not text:
                return False
            t = text.lower()
            return any(w in t for w in q.split() if len(w) > 2)

        meetings_list = sorted(
            meetings_list,
            key=lambda m: (
                m["id"] == focus_meeting_id,
                matches(m.get("title")) or matches(m.get("summary")),
            ),
            reverse=True,
        )

    return {
        "meetings": meetings_list,
        "tasks": tasks_list,
        "decisions": decisions_list,
    }
