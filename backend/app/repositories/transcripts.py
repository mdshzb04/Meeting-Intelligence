"""Database operations for transcripts and transcript chunks."""

import asyncpg
from typing import Optional, List


async def create_transcript(
    pool: asyncpg.Pool, meeting_id: str, full_text: str
) -> dict:
    """Store the full transcript for a meeting."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO transcripts (meeting_id, full_text)
            VALUES ($1::uuid, $2)
            RETURNING id, meeting_id, full_text, created_at
            """,
            meeting_id,
            full_text,
        )
        return dict(row)


async def get_transcript(pool: asyncpg.Pool, meeting_id: str) -> Optional[dict]:
    """Get the transcript for a meeting."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, meeting_id, full_text, created_at FROM transcripts WHERE meeting_id = $1::uuid",
            meeting_id,
        )
        return dict(row) if row else None


async def create_chunks(
    pool: asyncpg.Pool,
    meeting_id: str,
    chunks: List[dict],
) -> List[dict]:
    """Bulk insert transcript chunks."""
    async with pool.acquire() as conn:
        rows = []
        for chunk in chunks:
            row = await conn.fetchrow(
                """
                INSERT INTO transcript_chunks (meeting_id, chunk_index, chunk_text, embedding_id)
                VALUES ($1::uuid, $2, $3, $4)
                RETURNING id, meeting_id, chunk_index, chunk_text, embedding_id, created_at
                """,
                meeting_id,
                chunk["chunk_index"],
                chunk["chunk_text"],
                chunk.get("embedding_id"),
            )
            rows.append(dict(row))
        return rows


async def get_chunks(pool: asyncpg.Pool, meeting_id: str) -> List[dict]:
    """Get all chunks for a meeting, ordered by index."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, meeting_id, chunk_index, chunk_text, embedding_id, created_at
            FROM transcript_chunks
            WHERE meeting_id = $1::uuid
            ORDER BY chunk_index
            """,
            meeting_id,
        )
        return [dict(r) for r in rows]
