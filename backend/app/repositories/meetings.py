"""Database operations for meetings."""

import asyncpg
from typing import Optional, List
from datetime import datetime


async def create_meeting(
    pool: asyncpg.Pool,
    user_id: str,
    title: str,
    status: str = "processing",
    audio_filename: Optional[str] = None,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO meetings (user_id, title, status, audio_filename)
            VALUES ($1::uuid, $2, $3, $4)
            RETURNING id, title, status, summary, highlights, next_steps,
                      audio_filename, duration_seconds, created_at, updated_at
            """,
            user_id,
            title,
            status,
            audio_filename,
        )
        return dict(row)


async def update_meeting(
    pool: asyncpg.Pool,
    meeting_id: str,
    user_id: str,
    **kwargs,
) -> Optional[dict]:
    if not kwargs:
        return None

    set_clauses = []
    values = []
    idx = 1

    for key, value in kwargs.items():
        set_clauses.append(f"{key} = ${idx}")
        values.append(value)
        idx += 1

    set_clauses.append(f"updated_at = ${idx}")
    values.append(datetime.utcnow())
    idx += 1

    values.extend([meeting_id, user_id])

    query = f"""
        UPDATE meetings SET {', '.join(set_clauses)}
        WHERE id = ${idx}::uuid AND user_id = ${idx + 1}::uuid
        RETURNING id, title, status, summary, highlights, next_steps,
                  audio_filename, duration_seconds, created_at, updated_at
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def get_meeting_internal(pool: asyncpg.Pool, meeting_id: str) -> Optional[dict]:
    """Load meeting by id (background jobs only — no user scope)."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id::text AS user_id, title, status, summary, highlights, next_steps,
                   audio_filename, duration_seconds, created_at, updated_at
            FROM meetings WHERE id = $1::uuid
            """,
            meeting_id,
        )
        return dict(row) if row else None


async def update_meeting_internal(
    pool: asyncpg.Pool, meeting_id: str, **kwargs
) -> Optional[dict]:
    if not kwargs:
        return None
    set_clauses = []
    values = []
    idx = 1
    for key, value in kwargs.items():
        set_clauses.append(f"{key} = ${idx}")
        values.append(value)
        idx += 1
    set_clauses.append(f"updated_at = ${idx}")
    values.append(datetime.utcnow())
    idx += 1
    values.append(meeting_id)
    query = f"""
        UPDATE meetings SET {', '.join(set_clauses)}
        WHERE id = ${idx}::uuid
        RETURNING id, title, status, summary, highlights, next_steps,
                  audio_filename, duration_seconds, created_at, updated_at
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def get_meeting(
    pool: asyncpg.Pool, meeting_id: str, user_id: str
) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, title, status, summary, highlights, next_steps,
                   audio_filename, duration_seconds, created_at, updated_at
            FROM meetings WHERE id = $1::uuid AND user_id = $2::uuid
            """,
            meeting_id,
            user_id,
        )
        return dict(row) if row else None


async def list_meetings(
    pool: asyncpg.Pool,
    user_id: str,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[List[dict], int]:
    async with pool.acquire() as conn:
        if search:
            search_pattern = f"%{search}%"
            rows = await conn.fetch(
                """
                SELECT m.id, m.title, m.status, m.summary, m.created_at,
                       COALESCE(t.task_count, 0) as task_count,
                       COALESCE(t.completed_count, 0) as completed_task_count,
                       COALESCE(d.decision_count, 0) as decision_count
                FROM meetings m
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) as task_count,
                           COUNT(*) FILTER (WHERE status = 'completed') as completed_count
                    FROM tasks GROUP BY meeting_id
                ) t ON t.meeting_id = m.id
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) as decision_count
                    FROM decisions GROUP BY meeting_id
                ) d ON d.meeting_id = m.id
                WHERE m.user_id = $1::uuid
                  AND (m.title ILIKE $2 OR m.summary ILIKE $2)
                ORDER BY m.created_at DESC
                LIMIT $3 OFFSET $4
                """,
                user_id,
                search_pattern,
                limit,
                offset,
            )
            count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM meetings
                WHERE user_id = $1::uuid AND (title ILIKE $2 OR summary ILIKE $2)
                """,
                user_id,
                search_pattern,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT m.id, m.title, m.status, m.summary, m.created_at,
                       COALESCE(t.task_count, 0) as task_count,
                       COALESCE(t.completed_count, 0) as completed_task_count,
                       COALESCE(d.decision_count, 0) as decision_count
                FROM meetings m
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) as task_count,
                           COUNT(*) FILTER (WHERE status = 'completed') as completed_count
                    FROM tasks GROUP BY meeting_id
                ) t ON t.meeting_id = m.id
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) as decision_count
                    FROM decisions GROUP BY meeting_id
                ) d ON d.meeting_id = m.id
                WHERE m.user_id = $1::uuid
                ORDER BY m.created_at DESC
                LIMIT $2 OFFSET $3
                """,
                user_id,
                limit,
                offset,
            )
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM meetings WHERE user_id = $1::uuid", user_id
            )

        return [dict(r) for r in rows], count


async def delete_meeting(pool: asyncpg.Pool, meeting_id: str, user_id: str) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM meetings WHERE id = $1::uuid AND user_id = $2::uuid",
            meeting_id,
            user_id,
        )
        return result == "DELETE 1"
