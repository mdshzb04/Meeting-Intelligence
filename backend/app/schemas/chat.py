"""Pydantic schemas for chat."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    """Schema for sending a chat message."""
    content: str = Field(..., min_length=1, max_length=2000)


class ChatCitation(BaseModel):
    """A source citation for an assistant reply."""
    meeting_id: str
    meeting_title: str
    source_type: str
    excerpt: str
    label: str
    ref: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Chat message response."""
    id: str
    meeting_id: str
    role: str
    content: str
    citations: List[ChatCitation] = Field(default_factory=list)
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    """Chat history for a meeting."""
    messages: List[ChatMessageResponse]
    meeting_id: str
