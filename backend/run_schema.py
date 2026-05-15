"""Run schema.sql against Neon PostgreSQL using asyncpg (no psql needed)."""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()


async def run_schema():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set in .env")
        return

    print(f"Connecting to database...")

    try:
        conn = await asyncpg.connect(dsn=database_url)
    except Exception as e:
        print(f"ERROR: Could not connect: {e}")
        return

    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()

    try:
        await conn.execute(schema_sql)
        print("✅ Schema applied successfully!")
    except Exception as e:
        print(f"ERROR applying schema: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_schema())
