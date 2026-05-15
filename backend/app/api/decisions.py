"""Decision API endpoints — track decisions from meetings."""

import logging
from fastapi import APIRouter, Depends

from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import NotFoundError
from app.schemas.decisions import DecisionUpdate, DecisionResponse, DecisionListResponse
from app.repositories import decisions as decisions_repo
from app.repositories import meetings as meetings_repo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/meetings/{meeting_id}/decisions", response_model=DecisionListResponse)
async def get_meeting_decisions(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    meeting = await meetings_repo.get_meeting(pool, meeting_id, user["id"])
    if not meeting:
        raise NotFoundError(f"Meeting {meeting_id} not found")

    decisions = await decisions_repo.get_decisions(pool, meeting_id)
    stats = await decisions_repo.get_decision_stats(pool, meeting_id)

    return DecisionListResponse(
        decisions=[
            DecisionResponse(
                id=str(d["id"]),
                meeting_id=str(d["meeting_id"]),
                decision_text=d["decision_text"],
                implementation_status=d["implementation_status"],
                notes=d.get("notes"),
                created_at=d["created_at"],
            )
            for d in decisions
        ],
        total=stats["total"],
        implemented=stats["implemented"],
        pending=stats["pending"],
        in_progress=stats["in_progress"],
    )


@router.patch("/decisions/{decision_id}", response_model=DecisionResponse)
async def update_decision(
    decision_id: str,
    body: DecisionUpdate,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db),
):
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise NotFoundError("No update fields provided")

    async with pool.acquire() as conn:
        owned = await conn.fetchval(
            """
            SELECT 1 FROM decisions d
            JOIN meetings m ON m.id = d.meeting_id
            WHERE d.id = $1::uuid AND m.user_id = $2::uuid
            """,
            decision_id,
            user["id"],
        )
    if not owned:
        raise NotFoundError(f"Decision {decision_id} not found")

    decision = await decisions_repo.update_decision(pool, decision_id, **update_data)
    if not decision:
        raise NotFoundError(f"Decision {decision_id} not found")

    return DecisionResponse(
        id=str(decision["id"]),
        meeting_id=str(decision["meeting_id"]),
        decision_text=decision["decision_text"],
        implementation_status=decision["implementation_status"],
        notes=decision.get("notes"),
        created_at=decision["created_at"],
    )
