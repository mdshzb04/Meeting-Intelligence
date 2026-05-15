"""Background indexing for knowledge-base documents."""

import asyncio
import logging

from app.config import get_settings
from app.database import get_db
from app.repositories import knowledge as knowledge_repo
from app.services.embedding import chunk_text, generate_embeddings
from app.services.pinecone_service import upsert_knowledge_vectors, delete_knowledge_vectors

logger = logging.getLogger(__name__)


async def process_knowledge_document(document_id: str, user_id: str, text: str) -> None:
    pool = await get_db()
    settings = get_settings()
    timeout = settings.MEETING_PROCESSING_TIMEOUT_SECONDS
    log = logging.LoggerAdapter(logger, {"document_id": document_id, "user_id": user_id})

    try:
        async with asyncio.timeout(timeout):
            chunks = chunk_text(text)
            if not chunks:
                raise ValueError("No chunks produced from document")

            embeddings = await generate_embeddings(chunks)
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

            await upsert_knowledge_vectors(document_id, chunk_ids, embeddings, chunks)

            await knowledge_repo.update_document(
                pool,
                document_id,
                user_id,
                status="ready",
                chunk_count=len(chunks),
                error_message=None,
            )
            log.info("Knowledge document indexed", extra={"chunk_count": len(chunks)})

    except TimeoutError:
        log.error("Knowledge indexing timed out")
        await knowledge_repo.update_document(
            pool, document_id, user_id, status="failed", error_message="Processing timed out"
        )
    except Exception as e:
        log.exception("Knowledge indexing failed: %s", e)
        await knowledge_repo.update_document(
            pool,
            document_id,
            user_id,
            status="failed",
            error_message=str(e)[:500],
        )


async def delete_knowledge_index(document_id: str) -> None:
    try:
        await delete_knowledge_vectors(document_id)
    except Exception as e:
        logger.warning("KB vector delete failed: %s", e)
