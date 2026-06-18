"""Meeting API endpoints — create, list, get, delete meetings."""

import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import NotFoundError, ValidationError
from app.schemas.meetings import MeetingCreate, MeetingResponse, MeetingListResult, MeetingListResponse
from app.repositories import meetings as meetings_repo
from app.repositories import transcripts as transcripts_repo
from app.services.transcription import validate_audio_file, transcribe_audio
from app.services.pinecone_service import delete_meeting_vectors
from app.services.meeting_processor import (
    process_text_meeting,
    process_audio_meeting,
    retry_meeting_processing,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/meetings", response_model=MeetingResponse, status_code=201)
async def create_meeting_from_text(
    body: MeetingCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    logger.info("Creating meeting from text", extra={"title": body.title, "user_id": user["id"]})

    meeting = await meetings_repo.create_meeting(
        pool, user["id"], title=body.title, status="processing"
    )
    meeting_id = str(meeting["id"])

    background_tasks.add_task(
        process_text_meeting, meeting_id, body.transcript_text, title=body.title
    )

    return _format_meeting(meeting)


@router.post("/meetings/upload", response_model=MeetingResponse, status_code=201)
async def create_meeting_from_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    if not file.filename:
        raise ValidationError("No file provided")

    file_content = await file.read()
    validate_audio_file(file.filename, len(file_content))

    meeting = await meetings_repo.create_meeting(
        pool,
        user["id"],
        title=title or "Processing...",
        status="processing",
        audio_filename=file.filename,
    )
    meeting_id = str(meeting["id"])

    background_tasks.add_task(
        process_audio_meeting, meeting_id, file_content, file.filename, title=title
    )

    return _format_meeting(meeting)


@router.post("/meetings/{meeting_id}/retry", response_model=MeetingResponse)
async def retry_meeting(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    if meeting["status"] == "processing":
        raise ValidationError("Meeting is already processing")

    transcript = await transcripts_repo.get_transcript(pool, meeting_id)
    if not transcript:
        raise ValidationError(
            "No transcript available to retry. Please create a new meeting."
        )

    meeting = await meetings_repo.update_meeting(
        pool,
        meeting_id,
        user["id"],
        status="processing",
        summary=None,
        highlights=None,
        next_steps=None,
    )

    background_tasks.add_task(retry_meeting_processing, meeting_id)
    return _format_meeting(meeting)


@router.get("/meetings", response_model=MeetingListResult)
async def list_meetings(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meetings, total = await meetings_repo.list_meetings(
        pool, user["id"], search, limit, offset
    )

    return MeetingListResult(
        meetings=[
            MeetingListResponse(
                id=str(m["id"]),
                title=m["title"],
                status=m["status"],
                summary=m.get("summary"),
                created_at=m["created_at"],
                task_count=m.get("task_count", 0),
                completed_task_count=m.get("completed_task_count", 0),
                decision_count=m.get("decision_count", 0),
            )
            for m in meetings
        ],
        total=total,
    )


@router.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")
    return _format_meeting(meeting)


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    try:
        await delete_meeting_vectors(meeting_id)
    except Exception as e:
        logger.warning(
            "Failed to clean up vectors",
            extra={"meeting_id": meeting_id, "error": str(e)},
        )

    await meetings_repo.delete_meeting(pool, meeting_id, user["id"])
    return {"message": "Meeting deleted successfully"}


@router.post("/meetings/transcribe-chunk")
async def transcribe_chunk(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Transcribe a small chunk of audio in real-time."""
    if not file.filename:
        file.filename = "chunk.webm"
    file_content = await file.read()
    text = await transcribe_audio(file_content, file.filename)
    return {"text": text}


@router.get("/meetings/{meeting_id}/transcript")
async def get_transcript(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    transcript = await transcripts_repo.get_transcript(pool, meeting_id)
    if not transcript:
        raise NotFoundError("Transcript not found")

    return {
        "meeting_id": meeting_id,
        "full_text": transcript["full_text"],
        "created_at": transcript["created_at"],
    }


def _format_meeting(meeting: dict) -> MeetingResponse:
    return MeetingResponse(
        id=str(meeting["id"]),
        title=meeting["title"],
        status=meeting["status"],
        summary=meeting.get("summary"),
        highlights=meeting.get("highlights"),
        next_steps=meeting.get("next_steps"),
        audio_filename=meeting.get("audio_filename"),
        duration_seconds=meeting.get("duration_seconds"),
        created_at=meeting["created_at"],
        updated_at=meeting["updated_at"],
    )
