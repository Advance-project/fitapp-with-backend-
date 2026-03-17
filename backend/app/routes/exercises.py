from fastapi import APIRouter

from .. import database
from ..models import ExerciseResponse

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get(
    "",
    response_model=list[ExerciseResponse],
    summary="Get all exercise catalog entries",
)
async def get_exercises() -> list[ExerciseResponse]:
    rows = await database.get_exercises()
    return [ExerciseResponse(**row) for row in rows]
