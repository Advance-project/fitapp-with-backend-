# backend/app/routes/ai.py
import os
import re
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from openai import OpenAI
from app.fitness_rag import build_fitness_refusal, is_fitness_query, retrieve_fitness_context

# Only initialize if key is available
client = None
if os.getenv("OPENAI_API_KEY"):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

class RoutineRequest(BaseModel):
    prompt: str
    history: list[dict[str, str]] = []
    max_tokens: int = 450
    temperature: float = 0.75

class RoutineResponse(BaseModel):
    assistant: str


def _extract_days(prompt: str) -> int:
    match = re.search(r"(\d+)\s*[- ]?day", prompt.lower())
    if not match:
        return 4
    days = int(match.group(1))
    return max(2, min(days, 6))


def _build_local_routine(prompt: str) -> str:
    text = prompt.lower()
    days = _extract_days(prompt)

    goal = "general fitness"
    if "lose" in text or "fat" in text or "weight" in text:
        goal = "fat loss"
    elif "gain" in text or "muscle" in text or "bulk" in text:
        goal = "muscle gain"

    equipment = "gym"
    if "home" in text or "bodyweight" in text or "no equipment" in text:
        equipment = "home"

    if days <= 3:
        split = ["Full Body", "Upper Body", "Lower Body"]
    elif days == 4:
        split = ["Push", "Pull", "Legs", "Full Body + Core"]
    else:
        split = ["Push", "Pull", "Legs", "Upper", "Lower", "Cardio + Core"]

    split = split[:days]

    example_block = {
        "Push": "Bench Press 4x6-10, Overhead Press 3x8-12, Incline Press 3x8-12, Triceps 3x10-15",
        "Pull": "Row 4x6-10, Lat Pulldown/Pull-up 4x6-12, Rear Delt 3x12-15, Biceps 3x10-15",
        "Legs": "Squat 4x6-10, RDL 3x8-12, Split Squat 3x8-12, Calves 3x12-20",
        "Upper": "Bench 3x6-10, Row 3x8-12, OHP 3x8-12, Arms 2-3x10-15",
        "Lower": "Squat/Leg Press 4x6-10, Hip Hinge 3x8-12, Hamstring Curl 3x10-15, Core 3 sets",
        "Cardio + Core": "20-30 min intervals or brisk cardio + Plank, Crunches, Leg Raises (3 rounds)",
        "Full Body": "Squat 3x6-10, Press 3x8-12, Row 3x8-12, Hinge 3x8-12, Core 3 rounds",
        "Upper Body": "Horizontal Press 3x8-12, Row 3x8-12, Vertical Press 3x8-12, Arms 2-3x10-15",
        "Lower Body": "Squat 4x6-10, Hinge 3x8-12, Lunge 3x10 each side, Calves/Core 3 sets",
        "Full Body + Core": "Compound circuit 4 rounds + 10 min core finisher",
    }

    lines = [
        f"Here is your {days}-day {goal} plan ({equipment} setup):",
        "",
    ]

    for idx, day_name in enumerate(split, start=1):
        detail = example_block.get(day_name, "Compound movements + accessories")
        lines.append(f"Day {idx}: {day_name}")
        lines.append(f"- {detail}")
        lines.append("")

    lines.extend(
        [
            "Guidelines:",
            "- Warm up 8-10 min before lifting.",
            "- Keep 1-2 reps in reserve on most sets.",
            "- Progress weekly: +1 rep or +2.5 kg when all sets feel solid.",
            "- Sleep 7-9 h and keep protein high.",
        ]
    )

    return "\n".join(lines)

@router.post("/routine", response_model=RoutineResponse)
async def build_routine(payload: RoutineRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Prompt is required")

    if not is_fitness_query(prompt):
        return RoutineResponse(assistant=build_fitness_refusal())

    retrieved_context = retrieve_fitness_context(prompt)
    context_block = "\n".join(f"- {item}" for item in retrieved_context)

    chat_history: list[dict[str, str]] = []
    for item in payload.history[-6:]:
        role = item.get("role", "").strip().lower()
        content = item.get("content", "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        chat_history.append({"role": role, "content": content[:1200]})

    # If OpenAI isn't configured, provide a local fallback routine.
    if not client:
        return RoutineResponse(assistant=_build_local_routine(prompt))

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a fitness-only coach assistant. Stay strictly within fitness topics: workouts, exercise selection, "
                    "training splits, recovery, cardio, general nutrition for fitness goals, and safe beginner guidance. "
                    "If the user goes off-domain, politely refuse and redirect them to a fitness-related request. "
                    "Use the retrieved context below as grounding facts when helpful, but do not claim to read databases or documents directly.\n\n"
                    f"Retrieved fitness context:\n{context_block}"
                ),
            }
        ]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": prompt})

        completion = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
        )
        text = completion.choices[0].message.content.strip()
        return RoutineResponse(assistant=text)
    except Exception as exc:
        detail = str(exc)
        lower = detail.lower()

        if "insufficient_quota" in lower or "rate_limit" in lower or "429" in lower:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI quota exceeded. Please add billing/credits to get GPT responses.",
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {detail}",
        )