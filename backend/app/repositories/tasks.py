"""Database operations for tasks."""

import asyncpg
from typing import Optional, List
from datetime import datetime


async def create_task(
    pool: asyncpg.Pool,
    meeting_id: str,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
) -> dict:
    """Create a new task."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO tasks (meeting_id, title, description, priority)
            VALUES ($1::uuid, $2, $3, $4)
            RETURNING id, meeting_id, title, description, status, priority, created_at, completed_at
            """,
            meeting_id,
            title,
            description,
            priority,
        )
        return dict(row)


async def create_tasks_bulk(
    pool: asyncpg.Pool, meeting_id: str, tasks_data: List[dict]
) -> List[dict]:
    """Bulk create tasks from AI extraction."""
    results = []
    for task in tasks_data:
        result = await create_task(
            pool,
            meeting_id,
            title=task.get("title", "Untitled Task"),
            description=task.get("description"),
            priority=task.get("priority", "medium"),
        )
        results.append(result)
    return results


async def get_tasks(pool: asyncpg.Pool, meeting_id: str) -> List[dict]:
    """Get all tasks for a meeting."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, meeting_id, title, description, status, priority, created_at, completed_at
            FROM tasks
            WHERE meeting_id = $1::uuid
            ORDER BY
                CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
                created_at ASC
            """,
            meeting_id,
        )
        return [dict(r) for r in rows]


async def update_task(
    pool: asyncpg.Pool, task_id: str, **kwargs
) -> Optional[dict]:
    """Update task fields."""
    if not kwargs:
        return None

    # Handle completed_at logic
    if kwargs.get("status") == "completed":
        kwargs["completed_at"] = datetime.utcnow()
    elif kwargs.get("status") in ("pending", "in_progress"):
        kwargs["completed_at"] = None

    set_clauses = []
    values = []
    idx = 1

    for key, value in kwargs.items():
        set_clauses.append(f"{key} = ${idx}")
        values.append(value)
        idx += 1

    values.append(task_id)

    query = f"""
        UPDATE tasks SET {', '.join(set_clauses)}
        WHERE id = ${idx}::uuid
        RETURNING id, meeting_id, title, description, status, priority, created_at, completed_at
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def get_task_stats(pool: asyncpg.Pool, meeting_id: str) -> dict:
    """Get task statistics for a meeting."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
            FROM tasks WHERE meeting_id = $1::uuid
            """,
            meeting_id,
        )
        return dict(row)
