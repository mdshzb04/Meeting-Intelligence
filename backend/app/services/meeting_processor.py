"""Background meeting processing — AI analysis, embeddings, Pinecone."""

import asyncio
import logging
from typing import Optional

import asyncpg

from app.config import get_settings
from app.database import get_db
from app.repositories import meetings as meetings_repo
from app.repositories import transcripts as transcripts_repo
from app.repositories import tasks as tasks_repo
from app.repositories import decisions as decisions_repo
from app.services.transcription import transcribe_audio
from app.services.ai_processor import analyze_meeting, generate_meeting_title
from app.services.embedding import chunk_text, generate_embeddings
from app.services.pinecone_service import upsert_vectors, delete_meeting_vectors

logger = logging.getLogger(__name__)


async def process_text_meeting(
    meeting_id: str,
    transcript_text: str,
    *,
    title: Optional[str] = None,
) -> None:
    """Process a meeting from transcript text (background task entry)."""
    pool = await get_db()
    settings = get_settings()
    timeout = settings.MEETING_PROCESSING_TIMEOUT_SECONDS

    log = logging.LoggerAdapter(logger, {"meeting_id": meeting_id})

    try:
        async with asyncio.timeout(timeout):
            await _process_text_meeting(pool, meeting_id, transcript_text, title=title, log=log)
    except TimeoutError:
        log.error("Meeting processing timed out", extra={"timeout_seconds": timeout})
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")
    except Exception as e:
        log.exception("Meeting processing failed: %s", e)
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")


async def process_audio_meeting(
    meeting_id: str,
    file_content: bytes,
    filename: str,
    *,
    title: Optional[str] = None,
) -> None:
    """Transcribe audio then run full processing pipeline (background task entry)."""
    pool = await get_db()
    settings = get_settings()
    timeout = settings.MEETING_PROCESSING_TIMEOUT_SECONDS

    log = logging.LoggerAdapter(logger, {"meeting_id": meeting_id})

    try:
        async with asyncio.timeout(timeout):
            log.info("Starting audio transcription", extra={"filename": filename})
            transcript_text = await transcribe_audio(file_content, filename)

            if not transcript_text or len(transcript_text.strip()) < 10:
                raise ValueError("Transcription produced no usable text")

            await transcripts_repo.create_transcript(pool, meeting_id, transcript_text)

            if not title:
                generated_title = await asyncio.to_thread(
                    generate_meeting_title, transcript_text
                )
                await meetings_repo.update_meeting_internal(
                    pool, meeting_id, title=generated_title
                )
                log.info("Generated meeting title", extra={"title": generated_title})

            await _process_text_meeting(
                pool,
                meeting_id,
                transcript_text,
                title=None,
                log=log,
                skip_transcript_store=True,
            )
    except TimeoutError:
        log.error("Audio meeting processing timed out", extra={"timeout_seconds": timeout})
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")
    except Exception as e:
        log.exception("Audio meeting processing failed: %s", e)
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")


async def retry_meeting_processing(meeting_id: str) -> None:
    """Re-run processing for a failed meeting using stored transcript."""
    pool = await get_db()
    settings = get_settings()
    timeout = settings.MEETING_PROCESSING_TIMEOUT_SECONDS

    log = logging.LoggerAdapter(logger, {"meeting_id": meeting_id})

    transcript = await transcripts_repo.get_transcript(pool, meeting_id)
    if not transcript:
        log.error("Retry aborted: no transcript on record")
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")
        return

    try:
        async with asyncio.timeout(timeout):
            await _clear_derivatives(pool, meeting_id)
            await _process_text_meeting(
                pool,
                meeting_id,
                transcript["full_text"],
                title=None,
                log=log,
                skip_transcript_store=True,
            )
    except TimeoutError:
        log.error("Retry processing timed out", extra={"timeout_seconds": timeout})
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")
    except Exception as e:
        log.exception("Retry processing failed: %s", e)
        await meetings_repo.update_meeting_internal(pool, meeting_id, status="failed")


async def _process_text_meeting(
    pool: asyncpg.Pool,
    meeting_id: str,
    transcript_text: str,
    *,
    title: Optional[str],
    log: logging.LoggerAdapter,
    skip_transcript_store: bool = False,
) -> None:
    """Core pipeline: transcript → AI → tasks/decisions → embeddings → Pinecone."""
    log.info("Processing meeting started")

    if not skip_transcript_store:
        await transcripts_repo.create_transcript(pool, meeting_id, transcript_text)

    log.info("Running AI analysis")
    analysis = await analyze_meeting(transcript_text)

    meeting = await meetings_repo.update_meeting_internal(
        pool,
        meeting_id,
        status="completed",
        summary=analysis["summary"],
        highlights=analysis["highlights"],
        next_steps=analysis["next_steps"],
    )

    action_items = analysis.get("action_items") or []
    decisions = analysis.get("decisions") or []

    if action_items:
        await tasks_repo.create_tasks_bulk(pool, meeting_id, action_items)
        log.info("Created action items", extra={"count": len(action_items)})

    if decisions:
        await decisions_repo.create_decisions_bulk(pool, meeting_id, decisions)
        log.info("Created decisions", extra={"count": len(decisions)})

    chunks = chunk_text(transcript_text)
    if chunks:
        log.info("Generating embeddings", extra={"chunk_count": len(chunks)})
        embeddings = await generate_embeddings(chunks)

        chunk_records = []
        chunk_ids = []
        for i, chunk in enumerate(chunks):
            chunk_id = f"{meeting_id}_chunk_{i}"
            chunk_records.append({
                "chunk_index": i,
                "chunk_text": chunk,
                "embedding_id": chunk_id,
            })
            chunk_ids.append(chunk_id)

        await transcripts_repo.create_chunks(pool, meeting_id, chunk_records)
        await upsert_vectors(meeting_id, chunk_ids, embeddings, chunks)
        log.info("Stored vectors in Pinecone", extra={"vector_count": len(chunk_ids)})

    log.info(
        "Meeting processing completed",
        extra={"meeting_title": meeting.get("title") if meeting else None},
    )


async def _clear_derivatives(pool: asyncpg.Pool, meeting_id: str) -> None:
    """Remove partial outputs before retry."""
    try:
        await delete_meeting_vectors(meeting_id)
    except Exception as e:
        logger.warning(
            "Pinecone cleanup failed during retry",
            extra={"meeting_id": meeting_id, "error": str(e)},
        )

    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM tasks WHERE meeting_id = $1::uuid", meeting_id)
        await conn.execute("DELETE FROM decisions WHERE meeting_id = $1::uuid", meeting_id)
        await conn.execute(
            "DELETE FROM transcript_chunks WHERE meeting_id = $1::uuid", meeting_id
        )
