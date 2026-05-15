"""Per-user integration settings."""

import asyncpg


async def get_slack_webhook(pool: asyncpg.Pool, user_id: str) -> str | None:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT slack_webhook_url FROM users WHERE id = $1::uuid",
            user_id,
        )


async def set_slack_webhook(
    pool: asyncpg.Pool, user_id: str, webhook_url: str | None
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET slack_webhook_url = $2 WHERE id = $1::uuid",
            user_id,
            webhook_url,
        )
