"""Knowledge base documents and chat (per user)."""

import json
import asyncpg
from datetime import datetime
from typing import List, Optional


async def create_document(
    pool: asyncpg.Pool,
    user_id: str,
    title: str,
    filename: str,
    file_type: str,
    status: str = "processing",
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO knowledge_documents (user_id, title, filename, file_type, status)
            VALUES ($1::uuid, $2, $3, $4, $5)
            RETURNING id::text AS id, user_id::text AS user_id, title, filename,
                      file_type, status, chunk_count, error_message, created_at, updated_at
            """,
            user_id,
            title,
            filename,
            file_type,
            status,
        )
        return dict(row)


async def update_document(
    pool: asyncpg.Pool, document_id: str, user_id: str, **kwargs
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
    values.extend([document_id, user_id])
    query = f"""
        UPDATE knowledge_documents SET {', '.join(set_clauses)}
        WHERE id = ${idx}::uuid AND user_id = ${idx + 1}::uuid
        RETURNING id::text AS id, user_id::text AS user_id, title, filename,
                  file_type, status, chunk_count, error_message, created_at, updated_at
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def get_document(
    pool: asyncpg.Pool, document_id: str, user_id: str
) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id::text AS id, user_id::text AS user_id, title, filename,
                   file_type, status, chunk_count, error_message, created_at, updated_at
            FROM knowledge_documents
            WHERE id = $1::uuid AND user_id = $2::uuid
            """,
            document_id,
            user_id,
        )
        return dict(row) if row else None


async def list_documents(pool: asyncpg.Pool, user_id: str) -> List[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS id, title, filename, file_type, status,
                   chunk_count, error_message, created_at, updated_at
            FROM knowledge_documents
            WHERE user_id = $1::uuid
            ORDER BY created_at DESC
            """,
            user_id,
        )
        return [dict(r) for r in rows]


async def list_ready_document_ids(pool: asyncpg.Pool, user_id: str) -> List[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS id FROM knowledge_documents
            WHERE user_id = $1::uuid AND status = 'ready'
            ORDER BY created_at DESC
            """,
            user_id,
        )
        return [r["id"] for r in rows]


async def delete_document(pool: asyncpg.Pool, document_id: str, user_id: str) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM knowledge_documents WHERE id = $1::uuid AND user_id = $2::uuid",
            document_id,
            user_id,
        )
        return result == "DELETE 1"


async def create_kb_message(
    pool: asyncpg.Pool,
    user_id: str,
    role: str,
    content: str,
    citations: Optional[List[dict]] = None,
) -> dict:
    citations_json = json.dumps(citations or [])
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO knowledge_chat_messages (user_id, role, content, citations)
            VALUES ($1::uuid, $2, $3, $4::jsonb)
            RETURNING id::text AS id, user_id::text AS user_id, role, content,
                      citations, created_at
            """,
            user_id,
            role,
            content,
            citations_json,
        )
        result = dict(row)
        if isinstance(result.get("citations"), str):
            result["citations"] = json.loads(result["citations"])
        return result


async def get_kb_messages(pool: asyncpg.Pool, user_id: str, limit: int = 50) -> List[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS id, user_id::text AS user_id, role, content,
                   citations, created_at
            FROM knowledge_chat_messages
            WHERE user_id = $1::uuid
            ORDER BY created_at ASC
            LIMIT $2
            """,
            user_id,
            limit,
        )
        out = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get("citations"), str):
                d["citations"] = json.loads(d["citations"])
            elif d.get("citations") is None:
                d["citations"] = []
            out.append(d)
        return out


async def get_recent_kb_messages(
    pool: asyncpg.Pool, user_id: str, limit: int = 10
) -> List[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS id, user_id::text AS user_id, role, content,
                   citations, created_at
            FROM knowledge_chat_messages
            WHERE user_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT $2
            """,
            user_id,
            limit,
        )
        out = []
        for r in reversed(rows):
            d = dict(r)
            if isinstance(d.get("citations"), str):
                d["citations"] = json.loads(d["citations"])
            elif d.get("citations") is None:
                d["citations"] = []
            out.append(d)
        return out
