"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """All configuration is loaded from environment variables."""

    # Database
    DATABASE_URL: str

    # OpenAI
    OPENAI_API_KEY: str

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "meeting-intel"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # App settings
    MAX_UPLOAD_SIZE_MB: int = 25
    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 50

    # Must match your Pinecone index dimension (threadline index uses 1024)
    EMBEDDING_DIMENSIONS: int = 1024

    # Max seconds for background meeting processing (AI + embeddings)
    MEETING_PROCESSING_TIMEOUT_SECONDS: int = 600

    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRE_HOURS: int = 168

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance - loaded once on startup."""
    return Settings()
