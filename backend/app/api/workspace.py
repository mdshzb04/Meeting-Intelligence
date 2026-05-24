"""Global workspace endpoints — cross-meeting + cross-doc chat and stats."""

import logging
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import AIServiceError
from app.repositories import knowledge as knowledge_repo
from app.repositories import memory as memory_repo
from app.services.global_chat import global_workspace_chat

logger = logging.getLogger(__name__)
router = APIRouter()


class GlobalChatRequest(BaseModel):
    content: str
    mode: Literal["meetings", "knowledge", "everything"] = "everything"


@router.post("/workspace/global-chat")
async def global_chat(
    body: GlobalChatRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    """Single endpoint for cross-meeting + cross-doc RAG chat."""
    try:
        answer, citations = await global_workspace_chat(
            pool=pool,
            user_id=user["id"],
            user_query=body.content,
            mode=body.mode,
            chat_history=[],
        )
    except AIServiceError as e:
        return {"answer": str(e), "citations": [], "mode": body.mode}

    return {"answer": answer, "citations": citations, "mode": body.mode}


@router.get("/workspace/stats")
async def workspace_stats(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    """Ingestion dashboard — document counts, chunks, vector estimate."""
    docs = await knowledge_repo.list_documents(pool, user["id"])
    meeting_ids = await memory_repo.get_completed_meeting_ids(pool, user["id"])

    total_docs = len(docs)
    ready_docs = sum(1 for d in docs if d["status"] == "ready")
    processing_docs = sum(1 for d in docs if d["status"] == "processing")
    failed_docs = sum(1 for d in docs if d["status"] == "failed")
    total_kb_chunks = sum(d.get("chunk_count") or 0 for d in docs)

    # Estimate meeting transcript chunks (avg ~10 per meeting)
    estimated_meeting_chunks = len(meeting_ids) * 10

    return {
        "documents": {
            "total": total_docs,
            "ready": ready_docs,
            "processing": processing_docs,
            "failed": failed_docs,
        },
        "chunks": {
            "knowledge_docs": total_kb_chunks,
            "meetings_estimated": estimated_meeting_chunks,
            "total_estimated": total_kb_chunks + estimated_meeting_chunks,
        },
        "vectors": {
            "namespaces": total_docs + len(meeting_ids),
            "estimated_total": total_kb_chunks + estimated_meeting_chunks,
        },
        "meetings": {
            "completed": len(meeting_ids),
        },
    }
