from typing import Optional
import uuid
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ReturnDocument

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def connect(uri: str, db_name: str) -> None:
    global _client, _db
    _client = AsyncIOMotorClient(uri)
    _db = _client[db_name]


def close() -> None:
    global _client
    if _client:
        _client.close()
        _client = None


def _users():
    return _db["users"]


def _equipment_options():
    return _db["equipment_options"]


def _muscle_options():
    return _db["muscle_options"]


def _exercises():
    return _db["exercises"]


def _log_workouts():
    return _db["log_workouts"]


def _workout_templates():
    return _db["workout_templates"]


def _workout_history():
    return _db["workout_history"]


def _clean(doc: dict) -> dict:
    """Remove MongoDB internal _id before returning to callers."""
    doc.pop("_id", None)
    return doc


async def get_user_by_email(email: str) -> Optional[dict]:
    doc = await _users().find_one({"email": email.lower()})
    return _clean(doc) if doc else None


async def get_user_by_id(user_id: str) -> Optional[dict]:
    doc = await _users().find_one({"id": user_id})
    return _clean(doc) if doc else None


async def get_user_by_username(username: str) -> Optional[dict]:
    doc = await _users().find_one({"username": username})
    return _clean(doc) if doc else None


async def create_user(email: str, username: str, password_hash: str) -> dict:
    user = {
        "id": str(uuid.uuid4()),
        "email": email.lower(),
        "username": username,
        "password_hash": password_hash,
        "role": "user",
    }
    await _users().insert_one(user)
    return _clean(user)


async def update_user(user_id: str, fields: dict) -> Optional[dict]:
    doc = await _users().find_one_and_update(
        {"id": user_id},
        {"$set": fields},
        return_document=ReturnDocument.AFTER,
    )
    return _clean(doc) if doc else None


async def delete_user(user_id: str) -> bool:
    result = await _users().delete_one({"id": user_id})
    return result.deleted_count > 0


async def seed_admin(email: str, username: str, password_hash: str) -> None:
    """Create the admin user if it doesn't already exist."""
    if await get_user_by_username(username):
        return
    user = {
        "id": str(uuid.uuid4()),
        "email": email.lower(),
        "username": username,
        "password_hash": password_hash,
        "role": "admin",
    }
    try:
        await _users().insert_one(user)
    except Exception:
        pass  # already inserted by a concurrent startup (race guard)


async def ensure_indexes() -> None:
    """Call once on startup to create unique indexes."""
    await _users().create_index("email", unique=True)
    await _users().create_index("id", unique=True)
    await _users().create_index("username", unique=True)
    await _equipment_options().create_index("name", unique=True)
    await _muscle_options().create_index("name", unique=True)
    await _exercises().create_index("id", unique=True)
    await _exercises().create_index("name", unique=True)
    await _log_workouts().create_index("user_id", unique=True)
    await _log_workouts().create_index("updated_at")
    await _workout_templates().create_index([("user_id", 1), ("name", 1)], unique=True)
    await _workout_templates().create_index("updated_at")
    await _workout_history().create_index("user_id")
    await _workout_history().create_index("logged_at")


async def _seed_option_collection(collection, values: list[str]) -> None:
    """Insert missing option rows while keeping existing records intact."""
    existing = await collection.find({}, {"_id": 0, "name": 1}).to_list(length=None)
    existing_names = {doc.get("name") for doc in existing}

    docs = [
        {"name": value, "order": idx}
        for idx, value in enumerate(values)
        if value not in existing_names
    ]
    if docs:
        await collection.insert_many(docs)


async def seed_filter_options() -> None:
    equipment_values = ["None", "Barbell", "Dumbbell", "Machine"]
    muscle_values = [
        "Chest",
        "Biceps",
        "Triceps",
        "Shoulders",
        "Back",
        "Abs",
        "Legs",
        "Cardio",
    ]
    await _seed_option_collection(_equipment_options(), equipment_values)
    await _seed_option_collection(_muscle_options(), muscle_values)


async def get_equipment_options() -> list[str]:
    docs = await _equipment_options().find({}, {"_id": 0, "name": 1, "order": 1}).sort("order", 1).to_list(length=None)
    return [doc["name"] for doc in docs]


async def get_muscle_options() -> list[str]:
    docs = await _muscle_options().find({}, {"_id": 0, "name": 1, "order": 1}).sort("order", 1).to_list(length=None)
    return [doc["name"] for doc in docs]


async def seed_exercises() -> None:
    exercise_specs: list[tuple[str, list[tuple[str, str]]]] = [
        (
            "Chest",
            [
                ("Barbell Bench Press", "Barbell"),
                ("Incline Barbell Bench Press", "Barbell"),
                ("Dumbbell Bench Press", "Dumbbell"),
                ("Incline Dumbbell Press", "Dumbbell"),
                ("Dumbbell Fly", "Dumbbell"),
                ("Machine Chest Press", "Machine"),
                ("Pec Deck Fly", "Machine"),
                ("Cable Crossover", "Machine"),
                ("Push Up", "None"),
                ("Chest Dips", "None"),
            ],
        ),
        (
            "Biceps",
            [
                ("Barbell Curl", "Barbell"),
                ("EZ-Bar Curl", "Barbell"),
                ("Dumbbell Curl", "Dumbbell"),
                ("Hammer Curl", "Dumbbell"),
                ("Incline Dumbbell Curl", "Dumbbell"),
                ("Concentration Curl", "Dumbbell"),
                ("Preacher Curl Machine", "Machine"),
                ("Cable Biceps Curl", "Machine"),
                ("Chin Up", "None"),
                ("Reverse Curl", "Barbell"),
            ],
        ),
        (
            "Triceps",
            [
                ("Close-Grip Bench Press", "Barbell"),
                ("Skull Crusher", "Barbell"),
                ("Overhead Triceps Extension", "Dumbbell"),
                ("Dumbbell Kickback", "Dumbbell"),
                ("Triceps Pushdown", "Machine"),
                ("Rope Pushdown", "Machine"),
                ("Machine Triceps Extension", "Machine"),
                ("Bench Dip", "None"),
                ("Diamond Push Up", "None"),
                ("Lying Dumbbell Triceps Extension", "Dumbbell"),
            ],
        ),
        (
            "Shoulders",
            [
                ("Barbell Overhead Press", "Barbell"),
                ("Arnold Press", "Dumbbell"),
                ("Lateral Raise", "Dumbbell"),
                ("Front Raise", "Dumbbell"),
                ("Rear Delt Fly", "Dumbbell"),
                ("Machine Shoulder Press", "Machine"),
                ("Upright Row", "Barbell"),
                ("Face Pull", "Machine"),
                ("Pike Push Up", "None"),
                ("Handstand Hold", "None"),
            ],
        ),
        (
            "Back",
            [
                ("Deadlift", "Barbell"),
                ("Barbell Bent-Over Row", "Barbell"),
                ("T-Bar Row", "Barbell"),
                ("One-Arm Dumbbell Row", "Dumbbell"),
                ("Lat Pulldown", "Machine"),
                ("Seated Cable Row", "Machine"),
                ("Machine Row", "Machine"),
                ("Pull Up", "None"),
                ("Inverted Row", "None"),
                ("Hyperextension", "None"),
            ],
        ),
        (
            "Abs",
            [
                ("Plank", "None"),
                ("Side Plank", "None"),
                ("Crunch", "None"),
                ("Bicycle Crunch", "None"),
                ("Hanging Leg Raise", "None"),
                ("Russian Twist", "Dumbbell"),
                ("Dumbbell Side Bend", "Dumbbell"),
                ("Cable Crunch", "Machine"),
                ("Machine Crunch", "Machine"),
                ("Ab Wheel Rollout", "None"),
            ],
        ),
        (
            "Legs",
            [
                ("Barbell Back Squat", "Barbell"),
                ("Front Squat", "Barbell"),
                ("Romanian Deadlift", "Barbell"),
                ("Walking Lunges", "Dumbbell"),
                ("Goblet Squat", "Dumbbell"),
                ("Leg Press", "Machine"),
                ("Leg Extension", "Machine"),
                ("Leg Curl", "Machine"),
                ("Calf Raise", "Machine"),
                ("Bodyweight Squat", "None"),
            ],
        ),
        (
            "Cardio",
            [
                ("Air Bike", "Machine"),
                ("Treadmill Run", "Machine"),
                ("Rowing Machine", "Machine"),
                ("Elliptical", "Machine"),
                ("Jump Rope", "None"),
                ("Burpee", "None"),
                ("Mountain Climber", "None"),
                ("High Knees", "None"),
                ("Jumping Jacks", "None"),
                ("Stair Climber", "Machine"),
            ],
        ),
    ]

    exercise_rows: list[dict] = []
    order = 1
    for muscle, items in exercise_specs:
        for name, equipment in items:
            exercise_rows.append(
                {
                    "id": f"ex-{order:03d}",
                    "name": name,
                    "muscle": muscle,
                    "equipment": equipment,
                    "order": order,
                }
            )
            order += 1

    existing = await _exercises().find({}, {"_id": 0, "id": 1, "name": 1}).to_list(length=None)
    existing_ids = {doc.get("id") for doc in existing}
    existing_names = {doc.get("name") for doc in existing}
    docs_to_insert = [
        row for row in exercise_rows if row["id"] not in existing_ids and row["name"] not in existing_names
    ]
    if docs_to_insert:
        await _exercises().insert_many(docs_to_insert)


async def get_exercises() -> list[dict]:
    docs = await _exercises().find(
        {},
        {"_id": 0, "id": 1, "name": 1, "muscle": 1, "equipment": 1, "order": 1},
    ).sort("order", 1).to_list(length=None)
    return docs


async def get_log_workout_draft(user_id: str) -> Optional[dict]:
    doc = await _log_workouts().find_one({"user_id": user_id})
    return _clean(doc) if doc else None


async def upsert_log_workout_draft(
    user_id: str,
    exercises: list[dict],
    elapsed_seconds: int,
) -> dict:
    doc = await _log_workouts().find_one_and_update(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "exercises": exercises,
                "elapsed_seconds": elapsed_seconds,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return _clean(doc)


async def clear_log_workout_draft(user_id: str) -> bool:
    result = await _log_workouts().delete_one({"user_id": user_id})
    return result.deleted_count > 0


def _history_cutoff_utc(now: Optional[datetime] = None) -> datetime:
    current = now or datetime.now(timezone.utc)
    start_of_week = (current - timedelta(days=current.weekday())).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    return start_of_week - timedelta(days=7)


async def prune_workout_history(user_id: str) -> None:
    cutoff = _history_cutoff_utc()
    await _workout_history().delete_many({"user_id": user_id, "logged_at": {"$lt": cutoff}})


async def save_logged_workout(
    user_id: str,
    template_name: str,
    exercises: list[dict],
) -> dict:
    now = datetime.now(timezone.utc)

    total_sets = sum(len(ex.get("sets", [])) for ex in exercises)
    total_volume = 0
    for ex in exercises:
        for set_row in ex.get("sets", []):
            total_volume += int(set_row.get("kg", 0) or 0) * int(set_row.get("reps", 0) or 0)

    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "template_name": template_name,
        "title": f"Workout {now.date().isoformat()}",
        "exercises": exercises,
        "total_sets": total_sets,
        "total_volume": total_volume,
        "logged_at": now,
    }
    await _workout_history().insert_one(history_doc)

    await prune_workout_history(user_id)
    return _clean(history_doc)


async def save_workout_template_only(user_id: str, name: str, exercises: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    doc = await _workout_templates().find_one_and_update(
        {"user_id": user_id, "name": name},
        {
            "$set": {
                "user_id": user_id,
                "name": name,
                "exercises": exercises,
                "updated_at": now,
            },
            "$setOnInsert": {"id": str(uuid.uuid4())},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return _clean(doc)


async def get_workout_templates(user_id: str) -> list[dict]:
    docs = await _workout_templates().find(
        {"user_id": user_id},
        {"_id": 0, "id": 1, "name": 1, "exercises": 1, "updated_at": 1},
    ).sort("updated_at", -1).to_list(length=None)
    return docs


async def delete_workout_template(user_id: str, template_id: str) -> bool:
    result = await _workout_templates().delete_one({"user_id": user_id, "id": template_id})
    return result.deleted_count > 0


async def get_workout_history(user_id: str) -> list[dict]:
    await prune_workout_history(user_id)
    cutoff = _history_cutoff_utc()
    docs = await _workout_history().find(
        {"user_id": user_id, "logged_at": {"$gte": cutoff}},
        {
            "_id": 0,
            "id": 1,
            "template_name": 1,
            "title": 1,
            "exercises": 1,
            "total_sets": 1,
            "total_volume": 1,
            "logged_at": 1,
        },
    ).sort("logged_at", -1).to_list(length=None)
    return docs
