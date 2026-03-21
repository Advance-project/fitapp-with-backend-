from fastapi import APIRouter, Depends, HTTPException, status

from .. import database
from ..auth_utils import get_current_user, require_admin
from ..models import (
    GlobalWorkoutTemplateResponse,
    SaveGlobalTemplateRequest,
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

    has_invalid_set_values = False
    for exercise in payload.exercises:
        is_cardio = exercise.muscle.strip().lower() == "cardio"
        for set_row in exercise.sets:
            if is_cardio:
                intensity = set_row.intensity or 0
                time_minutes = set_row.time_minutes or 0
                if intensity <= 0 or time_minutes <= 0:
                    has_invalid_set_values = True
                    break
            else:
                kg = set_row.kg or 0
                reps = set_row.reps or 0
                if kg <= 0 or reps <= 0:
                    has_invalid_set_values = True
                    break
        if has_invalid_set_values:
            break

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


@router.get("/last-performance")
async def get_last_performance(
    exercise_ids: str,
    current_user: dict = Depends(get_current_user),
):
    ids = [eid.strip() for eid in exercise_ids.split(",") if eid.strip()]
    if not ids:
        return {}
    return await database.get_last_exercise_performance(current_user["id"], ids)


@router.get("/global-templates", response_model=list[GlobalWorkoutTemplateResponse])
async def get_global_templates():
    docs = await database.get_global_templates()
    return [GlobalWorkoutTemplateResponse(**doc) for doc in docs]


@router.post("/global-templates", response_model=GlobalWorkoutTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_global_template(
    payload: SaveGlobalTemplateRequest,
    current_user: dict = Depends(require_admin),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Template name is required",
        )
    saved = await database.save_global_template(
        name=name,
        target_muscle=payload.target_muscle,
        exercises=[ex.model_dump() for ex in payload.exercises],
    )
    return GlobalWorkoutTemplateResponse(**saved)


@router.delete("/global-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_global_template(
    template_id: str,
    current_user: dict = Depends(require_admin),
):
    deleted = await database.delete_global_template(template_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
