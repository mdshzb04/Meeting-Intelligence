"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.config import get_settings
from app.database import init_db, close_db
from app.exceptions import register_exception_handlers
from app.api import health, meetings, chat, tasks, decisions, auth, integrations, knowledge

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    logger.info("Starting Meeting Intelligence API...")

    # Initialize database
    await init_db(settings.DATABASE_URL)
    from app.database import get_db

    pool = await get_db()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS citations JSONB NOT NULL DEFAULT '[]'::jsonb
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await conn.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'User'"
        )
        await conn.execute(
            """
            ALTER TABLE meetings ADD COLUMN IF NOT EXISTS user_id UUID
            REFERENCES users(id) ON DELETE CASCADE
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id)"
        )
        await conn.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT"
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS knowledge_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'processing',
                chunk_count INT NOT NULL DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_knowledge_documents_user_id ON knowledge_documents(user_id)"
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS knowledge_chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_kb_chat_user_id ON knowledge_chat_messages(user_id)"
        )
    logger.info("Database initialized")

    yield

    # Cleanup
    await close_db()
    logger.info("Application shutdown complete")


# Create app
app = FastAPI(
    title="Meeting Intelligence API",
    description="AI-powered meeting analysis and chat",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.107:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    """Landing page when someone opens the API port in a browser."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>MeetingMind API</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #000; color: #ededed;
               max-width: 32rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6; }
        h1 { font-weight: 500; font-size: 1.5rem; }
        a { color: #fff; }
        code { background: #1a1a1a; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
        .muted { color: #888; font-size: 0.875rem; }
        ul { padding-left: 1.25rem; }
      </style>
    </head>
    <body>
      <h1>MeetingMind API is running</h1>
      <p class="muted">This port is the <strong>backend API</strong>, not the web app UI.</p>
      <ul>
        <li><a href="/docs">API docs (Swagger)</a></li>
        <li><a href="/api/health">Health check</a></li>
      </ul>
      <p><strong>Open the app UI:</strong><br />
        <a href="http://localhost:3000">http://localhost:3000</a>
        <span class="muted"> (start frontend with <code>npm run dev</code> in <code>frontend/</code>)</span>
      </p>
      <p class="muted">Do not use <code>0.0.0.0</code> in the browser — use <code>localhost</code> or <code>127.0.0.1</code> instead.</p>
    </body>
    </html>
    """


# Register routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(meetings.router, prefix="/api", tags=["Meetings"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(decisions.router, prefix="/api", tags=["Decisions"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(integrations.router, prefix="/api", tags=["Integrations"])
app.include_router(knowledge.router, prefix="/api", tags=["Knowledge"])
