"""Pydantic schemas for knowledge base."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class KnowledgeDocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    status: str
    chunk_count: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class KnowledgeDocumentListResponse(BaseModel):
    documents: List[KnowledgeDocumentResponse]
    total: int


class KnowledgeChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class KnowledgeCitation(BaseModel):
    document_id: str
    document_title: str
    excerpt: str
    label: str
    ref: Optional[str] = None


class KnowledgeChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: List[KnowledgeCitation] = Field(default_factory=list)
    created_at: datetime


class KnowledgeChatHistoryResponse(BaseModel):
    messages: List[KnowledgeChatMessageResponse]
