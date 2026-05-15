"""Pinecone vector storage service."""

import logging
from typing import List, Optional
from pinecone import Pinecone

from app.config import get_settings
from app.exceptions import AIServiceError

logger = logging.getLogger(__name__)

# Module-level client (initialized on first use)
_client: Optional[Pinecone] = None
_index = None


def _get_index():
    """Get or initialize the Pinecone index (lazy initialization)."""
    global _client, _index

    if _index is not None:
        return _index

    settings = get_settings()
    try:
        _client = Pinecone(api_key=settings.PINECONE_API_KEY)
        _index = _client.Index(settings.PINECONE_INDEX_NAME)
        logger.info(f"Pinecone index '{settings.PINECONE_INDEX_NAME}' connected")
        return _index
    except Exception as e:
        logger.error(f"Pinecone initialization failed: {e}")
        raise AIServiceError(f"Vector storage initialization failed: {str(e)}")


async def upsert_vectors(
    meeting_id: str,
    chunk_ids: List[str],
    embeddings: List[List[float]],
    chunks: List[str],
) -> None:
    """Upsert transcript chunk vectors into Pinecone.

    Uses meeting_id as namespace for isolation.
    """
    index = _get_index()

    try:
        vectors = []
        for chunk_id, embedding, chunk_text in zip(chunk_ids, embeddings, chunks):
            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": {
                    "meeting_id": meeting_id,
                    "text": chunk_text[:1000],  # Store truncated text in metadata
                },
            })

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            index.upsert(
                vectors=batch,
                namespace=f"meeting_{meeting_id}",
            )

        logger.info(f"Upserted {len(vectors)} vectors for meeting {meeting_id}")

    except Exception as e:
        logger.error(f"Pinecone upsert failed: {e}")
        raise AIServiceError(f"Vector storage failed: {str(e)}")


async def query_vectors_across_meetings(
    meeting_ids: List[str],
    query_embedding: List[float],
    top_k: int = 8,
    metric: str = "cosine",
) -> List[dict]:
    """Search transcript chunks across multiple meeting namespaces."""
    if not meeting_ids:
        return []

    index = _get_index()
    namespaces = [f"meeting_{mid}" for mid in meeting_ids]

    try:
        results = index.query_namespaces(
            vector=query_embedding,
            namespaces=namespaces,
            metric=metric,
            top_k=max(2, top_k // max(len(namespaces), 1)),
            include_metadata=True,
        )

        matches = []
        for match in results.matches:
            meta = match.metadata or {}
            if not isinstance(meta, dict):
                meta = dict(meta) if meta else {}
            ns = getattr(match, "namespace", "") or ""
            meeting_id = meta.get("meeting_id") or ns.replace("meeting_", "", 1)
            matches.append({
                "text": meta.get("text", ""),
                "score": match.score or 0.0,
                "id": match.id or "",
                "meeting_id": meeting_id,
            })

        matches.sort(key=lambda m: m["score"], reverse=True)
        return matches[:top_k]

    except Exception as e:
        logger.warning(f"Cross-meeting Pinecone query failed: {e}")
        return []


async def query_vectors(
    meeting_id: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[dict]:
    """Query Pinecone for similar transcript chunks.

    Returns list of dicts with 'text' and 'score' keys.
    """
    index = _get_index()

    try:
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=f"meeting_{meeting_id}",
            include_metadata=True,
        )

        matches = []
        for match in results.get("matches", []):
            matches.append({
                "text": match.get("metadata", {}).get("text", ""),
                "score": match.get("score", 0.0),
                "id": match.get("id", ""),
                "meeting_id": meeting_id,
            })

        logger.info(
            f"Query returned {len(matches)} matches for meeting {meeting_id}"
        )
        return matches

    except Exception as e:
        logger.error(f"Pinecone query failed: {e}")
        raise AIServiceError(f"Vector search failed: {str(e)}")


async def delete_meeting_vectors(meeting_id: str) -> None:
    """Delete all vectors for a meeting (cleanup on meeting delete)."""
    index = _get_index()

    try:
        index.delete(delete_all=True, namespace=f"meeting_{meeting_id}")
        logger.info(f"Deleted vectors for meeting {meeting_id}")
    except Exception as e:
        logger.warning(f"Failed to delete vectors for meeting {meeting_id}: {e}")


async def upsert_knowledge_vectors(
    document_id: str,
    chunk_ids: List[str],
    embeddings: List[List[float]],
    chunks: List[str],
) -> None:
    """Upsert knowledge-base chunk vectors (namespace kb_{document_id})."""
    index = _get_index()

    try:
        vectors = []
        for chunk_id, embedding, chunk_text in zip(chunk_ids, embeddings, chunks):
            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": {
                    "document_id": document_id,
                    "text": chunk_text[:1000],
                },
            })

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            index.upsert(vectors=batch, namespace=f"kb_{document_id}")

        logger.info(f"Upserted {len(vectors)} KB vectors for document {document_id}")

    except Exception as e:
        logger.error(f"KB Pinecone upsert failed: {e}")
        raise AIServiceError(f"Vector storage failed: {str(e)}")


async def query_vectors_across_knowledge(
    document_ids: List[str],
    query_embedding: List[float],
    top_k: int = 8,
    metric: str = "cosine",
) -> List[dict]:
    """Search knowledge-base chunks across document namespaces."""
    if not document_ids:
        return []

    index = _get_index()
    namespaces = [f"kb_{did}" for did in document_ids]

    try:
        results = index.query_namespaces(
            vector=query_embedding,
            namespaces=namespaces,
            metric=metric,
            top_k=max(2, top_k // max(len(namespaces), 1)),
            include_metadata=True,
        )

        matches = []
        for match in results.matches:
            meta = match.metadata or {}
            if not isinstance(meta, dict):
                meta = dict(meta) if meta else {}
            ns = getattr(match, "namespace", "") or ""
            document_id = meta.get("document_id") or ns.replace("kb_", "", 1)
            matches.append({
                "text": meta.get("text", ""),
                "score": match.score or 0.0,
                "id": match.id or "",
                "document_id": document_id,
            })

        matches.sort(key=lambda m: m["score"], reverse=True)
        return matches[:top_k]

    except Exception as e:
        logger.warning(f"Cross-document KB query failed: {e}")
        return []


async def delete_knowledge_vectors(document_id: str) -> None:
    """Delete all vectors for a knowledge document."""
    index = _get_index()

    try:
        index.delete(delete_all=True, namespace=f"kb_{document_id}")
        logger.info(f"Deleted KB vectors for document {document_id}")
    except Exception as e:
        logger.warning(f"Failed to delete KB vectors for document {document_id}: {e}")
