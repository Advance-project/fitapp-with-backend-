import re
from . import database


FITNESS_TERMS = {
    "fitness", "workout", "routine", "program", "training", "exercise", "exercises", "gym", "home",
    "muscle", "fat", "loss", "weight", "strength", "hypertrophy", "cardio", "bodyweight", "protein",
    "calories", "nutrition", "meal", "diet", "reps", "sets", "split", "push", "pull", "legs",
    "upper", "lower", "bench", "squat", "deadlift", "row", "press", "biceps", "triceps", "chest",
    "back", "shoulders", "abs", "core", "recovery", "sleep", "bulk", "cut", "endurance", "conditioning",
    "mobility", "warmup", "warm", "up", "beginner", "advanced", "coach", "fitness-focused",
}


OFF_DOMAIN_HINTS = {
    "weather", "movie", "movies", "politics", "election", "stock", "stocks", "crypto", "bitcoin",
    "programming", "code", "python", "javascript", "java", "travel", "hotel", "flight", "song",
    "music", "game", "games", "history", "math", "algebra", "physics", "chemistry", "essay",
}


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z]{3,}", text.lower()))


def is_fitness_query(prompt: str) -> bool:
    tokens = _tokenize(prompt)
    if not tokens:
        return False

    fitness_overlap = len(tokens & FITNESS_TERMS)
    off_domain_overlap = len(tokens & OFF_DOMAIN_HINTS)

    if fitness_overlap >= 2:
        return True
    if fitness_overlap >= 1 and off_domain_overlap == 0:
        return True
    return False


async def retrieve_fitness_context(prompt: str, top_k: int = 4) -> list[str]:
    """
    Retrieve relevant fitness knowledge base documents from MongoDB.
    Uses token overlap scoring with prompt query.
    """
    query_tokens = _tokenize(prompt)
    
    # Fetch all knowledge base documents from MongoDB
    knowledge_base = await database.get_all_knowledge_base()
    scored: list[tuple[int, str]] = []

    for chunk in knowledge_base:
        chunk_tokens = _tokenize(chunk["text"])
        score = len(query_tokens & chunk_tokens)
        if score > 0:
            scored.append((score, chunk["text"]))

    scored.sort(key=lambda item: item[0], reverse=True)
    top = [text for _, text in scored[:top_k]]

    if not top:
        # Fallback: return first top_k documents if no matches found
        top = [item["text"] for item in knowledge_base[:top_k]]

    return top


def build_fitness_refusal() -> str:
    return (
        "I can help only with fitness-related topics such as workout routines, exercise selection, training splits, "
        "fat loss, muscle gain, cardio, recovery, and general fitness nutrition. Ask me something in that scope."
    )