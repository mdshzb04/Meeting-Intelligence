"""Pydantic schemas for tasks."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")


class TaskResponse(BaseModel):
    """Task response."""
    id: str
    meeting_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class TaskListResponse(BaseModel):
    """Task list for a meeting."""
    tasks: List[TaskResponse]
    total: int
    completed: int
    pending: int
    in_progress: int
