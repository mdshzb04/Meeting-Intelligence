"""Chat API endpoints — workspace memory with citations."""

import logging
from fastapi import APIRouter, Depends

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import NotFoundError
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse,
    ChatCitation,
)
from app.repositories import chat as chat_repo
from app.repositories import meetings as meetings_repo
from app.services.rag import chat_with_memory

logger = logging.getLogger(__name__)
router = APIRouter()


def _format_message(m: dict, meeting_id: str) -> ChatMessageResponse:
    raw_citations = m.get("citations") or []
    citations: list[ChatCitation] = []
    for c in raw_citations:
        if not isinstance(c, dict):
            continue
        citations.append(
            ChatCitation(
                meeting_id=str(c.get("meeting_id", meeting_id)),
                meeting_title=c.get("meeting_title") or "Meeting",
                source_type=c.get("source_type") or "summary",
                excerpt=c.get("excerpt") or "",
                label=c.get("label") or "Source",
                ref=str(c["ref"]) if c.get("ref") is not None else None,
            )
        )
    return ChatMessageResponse(
        id=str(m["id"]),
        meeting_id=meeting_id,
        role=m["role"],
        content=m["content"],
        citations=citations,
        created_at=m["created_at"],
    )


@router.post("/meetings/{meeting_id}/chat", response_model=ChatMessageResponse)
async def send_chat_message(
    meeting_id: str,
    body: ChatMessageCreate,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")
    if meeting["status"] != "completed":
        raise NotFoundError("Meeting is still processing")

    await chat_repo.create_message(pool, meeting_id, "user", body.content)

    history = await chat_repo.get_recent_messages(pool, meeting_id, limit=10)
    history_for_llm = [
        {"role": m["role"], "content": m["content"]} for m in history
    ]
    if (
        history_for_llm
        and history_for_llm[-1]["role"] == "user"
        and history_for_llm[-1]["content"] == body.content
    ):
        history_for_llm = history_for_llm[:-1]

    answer, citations = await chat_with_memory(
        pool=pool,
        user_id=user["id"],
        meeting_id=meeting_id,
        meeting_title=meeting["title"],
        user_query=body.content,
        chat_history=history_for_llm,
    )

    assistant_msg = await chat_repo.create_message(
        pool, meeting_id, "assistant", answer, citations=citations
    )

    return _format_message(assistant_msg, meeting_id)


@router.get("/meetings/{meeting_id}/chat", response_model=ChatHistoryResponse)
async def get_chat_history(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    messages = await chat_repo.get_messages(pool, meeting_id)

    return ChatHistoryResponse(
        meeting_id=meeting_id,
        messages=[_format_message(m, meeting_id) for m in messages],
    )
