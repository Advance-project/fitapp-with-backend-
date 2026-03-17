from fastapi import APIRouter, Depends, status

from .. import database
from ..auth_utils import get_current_user
from ..models import LogWorkoutDraftResponse, LogWorkoutDraftUpsertRequest

router = APIRouter(prefix="/log-workout", tags=["Log Workout"])


@router.get("/draft", response_model=LogWorkoutDraftResponse)
async def get_draft(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    draft = await database.get_log_workout_draft(user_id)
    if draft is None:
        return LogWorkoutDraftResponse(user_id=user_id, exercises=[], elapsed_seconds=0)
    return LogWorkoutDraftResponse(**draft)


@router.put("/draft", response_model=LogWorkoutDraftResponse)
async def upsert_draft(
    payload: LogWorkoutDraftUpsertRequest,
    current_user: dict = Depends(get_current_user),
):
    draft = await database.upsert_log_workout_draft(
        user_id=current_user["id"],
        exercises=[exercise.model_dump() for exercise in payload.exercises],
        elapsed_seconds=payload.elapsed_seconds,
    )
    return LogWorkoutDraftResponse(**draft)


@router.delete("/draft", status_code=status.HTTP_204_NO_CONTENT)
async def clear_draft(current_user: dict = Depends(get_current_user)):
    await database.clear_log_workout_draft(current_user["id"])
