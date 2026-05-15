"""User persistence."""

import asyncpg


async def create_user(
    pool: asyncpg.Pool, name: str, email: str, password_hash: str
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, lower($2), $3)
            RETURNING id::text AS id, name, email, created_at
            """,
            name.strip(),
            email,
            password_hash,
        )
        return dict(row)


async def get_user_by_email(pool: asyncpg.Pool, email: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id::text AS id, name, email, password_hash, created_at
            FROM users WHERE email = lower($1)
            """,
            email,
        )
        return dict(row) if row else None


async def get_user_by_id(pool: asyncpg.Pool, user_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id::text AS id, name, email, created_at
            FROM users WHERE id = $1::uuid
            """,
            user_id,
        )
        return dict(row) if row else None
