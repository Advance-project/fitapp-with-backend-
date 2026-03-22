# backend/app/routes/ai.py
import os
import re
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from openai import OpenAI
from app.fitness_rag import build_fitness_refusal, is_fitness_query, retrieve_fitness_context
from app import database
from app.auth_utils import get_current_user

# Only initialize if key is available
client = None
if os.getenv("OPENAI_API_KEY"):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

class RoutineRequest(BaseModel):
    prompt: str
    max_tokens: int = 450
    temperature: float = 0.75
    conversation_id: str | None = None


class RoutineResponse(BaseModel):
    assistant: str
    conversation_id: str | None = None


class ChatConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    timestamp: str


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
async def build_routine(payload: RoutineRequest, user: dict = Depends(get_current_user)):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Prompt is required")

    if not is_fitness_query(prompt):
        return RoutineResponse(assistant=build_fitness_refusal())

    # Create or use existing conversation
    conv_id = payload.conversation_id
    if not conv_id:
        # Create new conversation with first message as title
        title = prompt[:50] + ("..." if len(prompt) > 50 else "")
        conv = await database.create_chat_conversation(user["id"], title)
        conv_id = conv["id"]
    
    # Save user message to conversation
    await database.save_chat_message(conv_id, "user", prompt)

    retrieved_context = await retrieve_fitness_context(prompt)
    context_block = "\n".join(f"- {item}" for item in retrieved_context)

    # Load full chat history from database
    conv = await database.get_conversation(conv_id)
    chat_history: list[dict[str, str]] = []
    if conv and "messages" in conv:
        # Get all messages except the one we just added
        all_messages = conv.get("messages", [])
        # Skip the last message since we just added the user prompt
        for msg in all_messages[:-1]:
            role = msg.get("role", "").lower()
            content = msg.get("content", "").strip()
            if role in {"user", "assistant"} and content:
                chat_history.append({"role": role, "content": content[:1200]})

    # If OpenAI isn't configured, provide a local fallback routine.
    if not client:
        response_text = _build_local_routine(prompt)
        await database.save_chat_message(conv_id, "assistant", response_text)
        return RoutineResponse(assistant=response_text, conversation_id=conv_id)

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
        
        # Save assistant response to conversation
        await database.save_chat_message(conv_id, "assistant", text)
        
        return RoutineResponse(assistant=text, conversation_id=conv_id)
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


@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """Retrieve all chat conversations for the authenticated user."""
    conversations = await database.get_user_conversations(user["id"])
    return [
        ChatConversationResponse(
            id=conv["id"],
            user_id=conv["user_id"],
            title=conv["title"],
            created_at=conv["created_at"],
            updated_at=conv["updated_at"],
            message_count=len(conv.get("messages", [])),
        )
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}/history")
async def get_conversation_history(conversation_id: str, user: dict = Depends(get_current_user)):
    """
    Get conversation history in chatbot format for loading into UI.
    Returns array of messages ready to display and use as history parameter.
    """
    conv = await database.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Verify ownership
    if conv["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return {
        "id": conv["id"],
        "title": conv["title"],
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "messages": [
            {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"],
            }
            for msg in conv.get("messages", [])
        ],
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(conversation_id: str, user: dict = Depends(get_current_user)):
    """Retrieve a specific conversation with all messages."""
    conv = await database.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Verify ownership
    if conv["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return {
        "id": conv["id"],
        "title": conv["title"],
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "messages": [
            ChatMessageResponse(
                role=msg["role"],
                content=msg["content"],
                timestamp=msg["timestamp"],
            )
            for msg in conv.get("messages", [])
        ],
    }


@router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    payload: dict,
    user: dict = Depends(get_current_user),
):
    """Update conversation title."""
    conv = await database.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Verify ownership
    if conv["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Title is required")
    
    updated = await database.update_conversation_title(conversation_id, title)
    return {
        "id": updated["id"],
        "title": updated["title"],
        "updated_at": updated["updated_at"],
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str, user: dict = Depends(get_current_user)):
    """Delete a conversation."""
    conv = await database.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Verify ownership
    if conv["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    success = await database.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete conversation")
    
    return {"message": "Conversation deleted successfully"}