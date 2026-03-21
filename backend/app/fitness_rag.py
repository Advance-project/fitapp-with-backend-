import re


FITNESS_KNOWLEDGE_BASE = [
    {
        "id": "goals-fat-loss",
        "text": (
            "Fat-loss routines should prioritize sustainable calorie deficit, resistance training 3-5 days per week, "
            "moderate cardio, step count, and high protein intake to preserve muscle."
        ),
    },
    {
        "id": "goals-muscle-gain",
        "text": (
            "Muscle-gain programs should prioritize progressive overload, 10-20 hard sets per muscle per week, "
            "adequate recovery, and protein spread across the day."
        ),
    },
    {
        "id": "goals-strength",
        "text": (
            "Strength-focused programming should emphasize compound lifts, lower rep ranges on main lifts, "
            "longer rest periods, and tracked progression over multiple weeks."
        ),
    },
    {
        "id": "progressive-overload",
        "text": (
            "Progressive overload can be achieved by adding reps, adding load, improving range of motion, "
            "or increasing total weekly volume while keeping technique consistent."
        ),
    },
    {
        "id": "recovery",
        "text": (
            "Recovery fundamentals include 7-9 hours of sleep, at least 1-2 rest days weekly depending on split, "
            "stress management, and avoiding excessive failure on all sets."
        ),
    },
    {
        "id": "nutrition-protein",
        "text": (
            "General fitness nutrition should include sufficient daily protein, hydration, enough fruits and vegetables, "
            "and calorie intake matched to the goal of fat loss, maintenance, or muscle gain."
        ),
    },
    {
        "id": "split-ppl",
        "text": (
            "Push Pull Legs splits group chest, shoulders, triceps on push day; back and biceps on pull day; "
            "and lower body on leg day. They work well for 3-6 training days per week."
        ),
    },
    {
        "id": "split-upper-lower",
        "text": (
            "Upper Lower splits work well for 4 days per week, balancing recovery and frequency by training upper body twice "
            "and lower body twice weekly."
        ),
    },
    {
        "id": "beginner-programming",
        "text": (
            "Beginners benefit from simple routines with limited exercise variation, repeated movement patterns, "
            "moderate volume, and clear progression targets."
        ),
    },
    {
        "id": "home-workouts",
        "text": (
            "Home training can use bodyweight, dumbbells, bands, and tempo control. Good home substitutions include push-ups, rows, split squats, hinges, lunges, planks, and carries."
        ),
    },
    {
        "id": "cardio",
        "text": (
            "Cardio can support fat loss and conditioning. It should usually complement resistance training rather than replace it, unless the goal is specifically endurance-focused."
        ),
    },
    {
        "id": "safety",
        "text": (
            "Coaching guidance should stay general, avoid diagnosis, and encourage users with pain, injury, or medical conditions to consult a qualified professional."
        ),
    },
]


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


def retrieve_fitness_context(prompt: str, top_k: int = 4) -> list[str]:
    query_tokens = _tokenize(prompt)
    scored: list[tuple[int, str]] = []

    for chunk in FITNESS_KNOWLEDGE_BASE:
        chunk_tokens = _tokenize(chunk["text"])
        score = len(query_tokens & chunk_tokens)
        if score > 0:
            scored.append((score, chunk["text"]))

    scored.sort(key=lambda item: item[0], reverse=True)
    top = [text for _, text in scored[:top_k]]

    if not top:
        top = [item["text"] for item in FITNESS_KNOWLEDGE_BASE[:top_k]]

    return top


def build_fitness_refusal() -> str:
    return (
        "I can help only with fitness-related topics such as workout routines, exercise selection, training splits, "
        "fat loss, muscle gain, cardio, recovery, and general fitness nutrition. Ask me something in that scope."
    )