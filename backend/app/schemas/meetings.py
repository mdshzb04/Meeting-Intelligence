"""Pydantic schemas for meetings."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MeetingCreate(BaseModel):
    """Schema for creating a meeting via text input."""
    title: str = Field(..., min_length=1, max_length=255)
    transcript_text: str = Field(..., min_length=10)


class MeetingSummary(BaseModel):
    """AI-generated meeting summary data."""
    summary: str
    highlights: str
    next_steps: str
    action_items: List[dict]
    decisions: List[dict]


class MeetingResponse(BaseModel):
    """Full meeting response."""
    id: str
    title: str
    status: str
    summary: Optional[str] = None
    highlights: Optional[str] = None
    next_steps: Optional[str] = None
    audio_filename: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class MeetingListResponse(BaseModel):
    """Meeting list item."""
    id: str
    title: str
    status: str
    summary: Optional[str] = None
    created_at: datetime
    task_count: int = 0
    completed_task_count: int = 0
    decision_count: int = 0


class MeetingListResult(BaseModel):
    """Paginated meeting list result."""
    meetings: List[MeetingListResponse]
    total: int
