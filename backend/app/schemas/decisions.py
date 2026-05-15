"""Pydantic schemas for decisions."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DecisionUpdate(BaseModel):
    """Schema for updating a decision."""
    implementation_status: Optional[str] = Field(
        None, pattern="^(pending|in_progress|implemented)$"
    )
    notes: Optional[str] = None


class DecisionResponse(BaseModel):
    """Decision response."""
    id: str
    meeting_id: str
    decision_text: str
    implementation_status: str
    notes: Optional[str] = None
    created_at: datetime


class DecisionListResponse(BaseModel):
    """Decision list for a meeting."""
    decisions: List[DecisionResponse]
    total: int
    implemented: int
    pending: int
    in_progress: int
