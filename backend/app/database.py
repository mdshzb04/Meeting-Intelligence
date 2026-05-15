"""Database connection pool for Neon PostgreSQL using asyncpg."""

import asyncpg
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db(database_url: str) -> None:
    """Initialize the database connection pool."""
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            dsn=database_url,
            min_size=2,
            max_size=10,
            command_timeout=30,
            server_settings={"application_name": "meeting-intel"},
        )
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise


async def close_db() -> None:
    """Close the database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")


async def get_db() -> asyncpg.Pool:
    """Get the database connection pool. Used as a FastAPI dependency."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool
