from fastapi import APIRouter

from .. import database
from ..models import FilterOptionsResponse

router = APIRouter(prefix="/filters", tags=["Filters"])


@router.get(
    "/options",
    response_model=FilterOptionsResponse,
    summary="Get filter options for exercise search",
)
async def get_filter_options() -> FilterOptionsResponse:
    equipment = await database.get_equipment_options()
    muscles = await database.get_muscle_options()

    return FilterOptionsResponse(
        equipment_options=["All Equipment", *equipment],
        muscle_options=["All Muscles", *muscles],
    )
