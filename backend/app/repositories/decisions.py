"""Database operations for decisions."""

import asyncpg
from typing import Optional, List


async def create_decision(
    pool: asyncpg.Pool,
    meeting_id: str,
    decision_text: str,
    notes: Optional[str] = None,
) -> dict:
    """Create a new decision."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO decisions (meeting_id, decision_text, notes)
            VALUES ($1::uuid, $2, $3)
            RETURNING id, meeting_id, decision_text, implementation_status, notes, created_at
            """,
            meeting_id,
            decision_text,
            notes,
        )
        return dict(row)


async def create_decisions_bulk(
    pool: asyncpg.Pool, meeting_id: str, decisions_data: List[dict]
) -> List[dict]:
    """Bulk create decisions from AI extraction."""
    results = []
    for decision in decisions_data:
        result = await create_decision(
            pool,
            meeting_id,
            decision_text=decision.get("decision_text", ""),
            notes=decision.get("notes"),
        )
        results.append(result)
    return results


async def get_decisions(pool: asyncpg.Pool, meeting_id: str) -> List[dict]:
    """Get all decisions for a meeting."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, meeting_id, decision_text, implementation_status, notes, created_at
            FROM decisions
            WHERE meeting_id = $1::uuid
            ORDER BY created_at ASC
            """,
            meeting_id,
        )
        return [dict(r) for r in rows]


async def update_decision(
    pool: asyncpg.Pool, decision_id: str, **kwargs
) -> Optional[dict]:
    """Update decision fields."""
    if not kwargs:
        return None

    set_clauses = []
    values = []
    idx = 1

    for key, value in kwargs.items():
        set_clauses.append(f"{key} = ${idx}")
        values.append(value)
        idx += 1

    values.append(decision_id)

    query = f"""
        UPDATE decisions SET {', '.join(set_clauses)}
        WHERE id = ${idx}::uuid
        RETURNING id, meeting_id, decision_text, implementation_status, notes, created_at
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def get_decision_stats(pool: asyncpg.Pool, meeting_id: str) -> dict:
    """Get decision statistics for a meeting."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE implementation_status = 'implemented') as implemented,
                COUNT(*) FILTER (WHERE implementation_status = 'pending') as pending,
                COUNT(*) FILTER (WHERE implementation_status = 'in_progress') as in_progress
            FROM decisions WHERE meeting_id = $1::uuid
            """,
            meeting_id,
        )
        return dict(row)
