"""OpenAI embedding service for transcript chunks."""

import asyncio
import logging
from typing import List
from openai import OpenAI

from app.config import get_settings
from app.exceptions import AIServiceError
from app.services.traceplane_client import traced, record_embedding_usage

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks by approximate word count.

    Args:
        text: The full transcript text
        chunk_size: Approximate number of words per chunk
        overlap: Number of overlapping words between chunks
    """
    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)

        if end >= len(words):
            break

        start = end - overlap

    logger.info(f"Text chunked into {len(chunks)} chunks (~{chunk_size} words each)")
    return chunks


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of text chunks.

    Uses OpenAI text-embedding-3-small model (1536 dimensions).
    Batches are handled automatically by the API.
    """
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        logger.info(f"Generating embeddings for {len(texts)} chunks")

        dims = settings.EMBEDDING_DIMENSIONS
        with traced("embedding-generator", model=EMBEDDING_MODEL) as span:
            span.set_input(f"{len(texts)} chunks")
            response = await asyncio.to_thread(
                client.embeddings.with_options(timeout=60.0).create,
                model=EMBEDDING_MODEL,
                input=texts,
                dimensions=dims,
            )
            embeddings = [item.embedding for item in response.data]
            record_embedding_usage(span, response, EMBEDDING_MODEL)
            span.set_output(f"{len(embeddings)} embeddings")
        logger.info(f"Generated {len(embeddings)} embeddings ({dims}d)")
        return embeddings

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise AIServiceError(f"Embedding generation failed: {str(e)}")


async def generate_single_embedding(text: str) -> List[float]:
    """Generate embedding for a single text (e.g., a chat query)."""
    embeddings = await generate_embeddings([text])
    return embeddings[0]
