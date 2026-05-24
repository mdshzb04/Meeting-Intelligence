"""Knowledge base API — document upload, list, delete, and RAG chat."""

import hashlib
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks

from app.config import get_settings
from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import NotFoundError, ValidationError
from app.repositories import knowledge as knowledge_repo
from app.schemas.knowledge import (
    KnowledgeDocumentResponse,
    KnowledgeDocumentListResponse,
    KnowledgeChatMessageCreate,
    KnowledgeChatMessageResponse,
    KnowledgeChatHistoryResponse,
    KnowledgeCitation,
)
from app.services.document_parser import validate_knowledge_file, extract_text
from app.services.knowledge_processor import (
    process_knowledge_document,
    delete_knowledge_index,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _format_document(d: dict) -> KnowledgeDocumentResponse:
    return KnowledgeDocumentResponse(
        id=str(d["id"]),
        title=d["title"],
        filename=d["filename"],
        file_type=d["file_type"],
        status=d["status"],
        chunk_count=d.get("chunk_count") or 0,
        error_message=d.get("error_message"),
        created_at=d["created_at"],
        updated_at=d.get("updated_at"),
    )


def _format_kb_message(m: dict) -> KnowledgeChatMessageResponse:
    raw_citations = m.get("citations") or []
    citations: list[KnowledgeCitation] = []
    for c in raw_citations:
        if not isinstance(c, dict):
            continue
        citations.append(
            KnowledgeCitation(
                document_id=str(c.get("document_id", "")),
                document_title=c.get("document_title") or "Document",
                excerpt=c.get("excerpt") or "",
                label=c.get("label") or "Source",
                ref=str(c["ref"]) if c.get("ref") is not None else None,
            )
        )
    return KnowledgeChatMessageResponse(
        id=str(m["id"]),
        role=m["role"],
        content=m["content"],
        citations=citations,
        created_at=m["created_at"],
    )


@router.post("/knowledge/documents", response_model=KnowledgeDocumentResponse, status_code=201)
async def upload_knowledge_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    if not file.filename:
        raise ValidationError("No file provided")

    settings = get_settings()
    content = await file.read()
    ext = validate_knowledge_file(file.filename, len(content), settings.MAX_UPLOAD_SIZE_MB)
    text = extract_text(file.filename, content)

    doc_title = (title or Path(file.filename).stem).strip() or "Untitled"
    file_type = ext.lstrip(".")

    doc = await knowledge_repo.create_document(
        pool,
        user["id"],
        title=doc_title,
        filename=file.filename,
        file_type=file_type,
        status="processing",
    )
    document_id = str(doc["id"])

    background_tasks.add_task(
        process_knowledge_document, document_id, user["id"], text
    )

    return _format_document(doc)


@router.post("/knowledge/documents/batch", status_code=202)
async def upload_knowledge_documents_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    """Accept multiple files; skip exact duplicates (same filename+hash)."""
    settings = get_settings()
    results = []

    existing_rows = await knowledge_repo.list_documents(pool, user["id"])
    existing_hashes: set[str] = set()
    for row in existing_rows:
        h = row.get("content_hash") or ""
        if h:
            existing_hashes.add(h)

    for file in files:
        if not file.filename:
            results.append({"filename": "?", "status": "skipped", "reason": "no filename"})
            continue

        try:
            content = await file.read()
            ext = validate_knowledge_file(file.filename, len(content), settings.MAX_UPLOAD_SIZE_MB)
        except Exception as exc:
            results.append({"filename": file.filename, "status": "error", "reason": str(exc)})
            continue

        content_hash = hashlib.sha256(content).hexdigest()
        if content_hash in existing_hashes:
            results.append({"filename": file.filename, "status": "duplicate", "reason": "already indexed"})
            continue
        existing_hashes.add(content_hash)

        try:
            text = extract_text(file.filename, content)
        except Exception as exc:
            results.append({"filename": file.filename, "status": "error", "reason": str(exc)})
            continue

        doc_title = Path(file.filename).stem.strip() or "Untitled"
        doc = await knowledge_repo.create_document(
            pool,
            user["id"],
            title=doc_title,
            filename=file.filename,
            file_type=ext.lstrip("."),
            status="processing",
        )
        background_tasks.add_task(
            process_knowledge_document, str(doc["id"]), user["id"], text
        )
        results.append({"filename": file.filename, "status": "queued", "document_id": str(doc["id"])})

    queued = sum(1 for r in results if r["status"] == "queued")
    logger.info("Batch upload: %d queued, user=%s", queued, user["id"])
    return {"results": results, "queued": queued}


@router.get("/knowledge/documents", response_model=KnowledgeDocumentListResponse)
async def list_knowledge_documents(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    rows = await knowledge_repo.list_documents(pool, user["id"])
    docs = [_format_document(d) for d in rows]
    return KnowledgeDocumentListResponse(documents=docs, total=len(docs))


@router.delete("/knowledge/documents/{document_id}")
async def delete_knowledge_document(
    document_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    doc = await knowledge_repo.get_document(pool, document_id, user["id"])
    if not doc:
        raise NotFoundError("Document not found")

    await delete_knowledge_index(document_id)
    deleted = await knowledge_repo.delete_document(pool, document_id, user["id"])
    if not deleted:
        raise NotFoundError("Document not found")

    return {"message": "Document deleted"}


@router.post("/knowledge/chat", response_model=KnowledgeChatMessageResponse)
async def send_knowledge_chat(
    body: KnowledgeChatMessageCreate,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    from app.services.knowledge_rag import chat_with_knowledge

    await knowledge_repo.create_kb_message(pool, user["id"], "user", body.content)

    history = await knowledge_repo.get_recent_kb_messages(pool, user["id"], limit=10)
    history_for_llm = [{"role": m["role"], "content": m["content"]} for m in history]
    if (
        history_for_llm
        and history_for_llm[-1]["role"] == "user"
        and history_for_llm[-1]["content"] == body.content
    ):
        history_for_llm = history_for_llm[:-1]

    answer, citations = await chat_with_knowledge(
        pool=pool,
        user_id=user["id"],
        user_query=body.content,
        chat_history=history_for_llm,
    )

    assistant_msg = await knowledge_repo.create_kb_message(
        pool, user["id"], "assistant", answer, citations=citations
    )

    return _format_kb_message(assistant_msg)


@router.get("/knowledge/chat", response_model=KnowledgeChatHistoryResponse)
async def get_knowledge_chat_history(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    messages = await knowledge_repo.get_kb_messages(pool, user["id"])
    return KnowledgeChatHistoryResponse(
        messages=[_format_kb_message(m) for m in messages],
    )
