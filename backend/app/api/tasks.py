"""Task API endpoints — manage action items from meetings."""

import logging
from fastapi import APIRouter, Depends

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import NotFoundError
from app.schemas.tasks import TaskUpdate, TaskResponse, TaskListResponse
from app.repositories import tasks as tasks_repo
from app.repositories import meetings as meetings_repo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/meetings/{meeting_id}/tasks", response_model=TaskListResponse)
async def get_meeting_tasks(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    tasks = await tasks_repo.get_tasks(pool, meeting_id)
    stats = await tasks_repo.get_task_stats(pool, meeting_id)

    return TaskListResponse(
        tasks=[
            TaskResponse(
                id=str(t["id"]),
                meeting_id=str(t["meeting_id"]),
                title=t["title"],
                description=t.get("description"),
                status=t["status"],
                priority=t["priority"],
                created_at=t["created_at"],
                completed_at=t.get("completed_at"),
            )
            for t in tasks
        ],
        total=stats["total"],
        completed=stats["completed"],
        pending=stats["pending"],
        in_progress=stats["in_progress"],
    )


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise NotFoundError("No update fields provided")

    async with pool.acquire() as conn:
        owned = await conn.fetchval(
            """
            SELECT 1 FROM tasks t
            JOIN meetings m ON m.id = t.meeting_id
            WHERE t.id = $1::uuid AND m.user_id = $2::uuid
            """,
            task_id,
            user["id"],
        )
    if not owned:
        raise NotFoundError(f"Task {task_id} not found")

    task = await tasks_repo.update_task(pool, task_id, **update_data)
    if not task:
        raise NotFoundError(f"Task {task_id} not found")

    return TaskResponse(
        id=str(task["id"]),
        meeting_id=str(task["meeting_id"]),
        title=task["title"],
        description=task.get("description"),
        status=task["status"],
        priority=task["priority"],
        created_at=task["created_at"],
        completed_at=task.get("completed_at"),
    )
