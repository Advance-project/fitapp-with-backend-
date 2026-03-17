from fastapi import APIRouter, Depends, HTTPException, status

from .. import database
from ..auth_utils import get_current_user
from ..models import (
    SaveLoggedWorkoutRequest,
    SaveTemplateRequest,
    WorkoutHistoryResponse,
    WorkoutTemplateResponse,
)

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.post("/log", response_model=WorkoutHistoryResponse)
async def save_logged_workout(
    payload: SaveLoggedWorkoutRequest,
    current_user: dict = Depends(get_current_user),
):
    template_name = payload.template_name.strip()
    if not template_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Template name is required",
        )

    if any(len(exercise.sets) == 0 for exercise in payload.exercises):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid workout session logged please enter correct logs",
        )

    has_invalid_set_values = any(
        (set_row.kg <= 0 or set_row.reps <= 0)
        for exercise in payload.exercises
        for set_row in exercise.sets
    )
    if has_invalid_set_values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid workout session logged please enter correct logs",
        )

    saved = await database.save_logged_workout(
        user_id=current_user["id"],
        template_name=template_name,
        exercises=[exercise.model_dump() for exercise in payload.exercises],
    )
    return WorkoutHistoryResponse(**saved)


@router.get("/templates", response_model=list[WorkoutTemplateResponse])
async def get_templates(current_user: dict = Depends(get_current_user)):
    docs = await database.get_workout_templates(current_user["id"])
    return [WorkoutTemplateResponse(**doc) for doc in docs]


@router.post("/templates", response_model=WorkoutTemplateResponse)
async def save_template(
    payload: SaveTemplateRequest,
    current_user: dict = Depends(get_current_user),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Template name is required",
        )
    saved = await database.save_workout_template_only(
        user_id=current_user["id"],
        name=name,
        exercises=[ex.model_dump() for ex in payload.exercises],
    )
    return WorkoutTemplateResponse(**saved)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    deleted = await database.delete_workout_template(current_user["id"], template_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")


@router.get("/history", response_model=list[WorkoutHistoryResponse])
async def get_history(current_user: dict = Depends(get_current_user)):
    docs = await database.get_workout_history(current_user["id"])
    return [WorkoutHistoryResponse(**doc) for doc in docs]
