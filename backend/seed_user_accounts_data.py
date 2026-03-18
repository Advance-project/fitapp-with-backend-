import asyncio
import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import DB_NAME, MONGODB_URI


TARGET_TEMPLATES_PER_USER = 7
TARGET_HISTORY_PER_USER = 10


@dataclass
class RoutineBlueprint:
    name: str
    muscles: list[str]


BLUEPRINTS = [
    RoutineBlueprint(name="Upper Body Strength", muscles=["Chest", "Back", "Shoulders", "Biceps", "Triceps"]),
    RoutineBlueprint(name="Legs And Core Day", muscles=["Legs", "Abs", "Cardio"]),
    RoutineBlueprint(name="Push Focus", muscles=["Chest", "Shoulders", "Triceps"]),
    RoutineBlueprint(name="Pull Focus", muscles=["Back", "Biceps", "Abs"]),
    RoutineBlueprint(name="Chest And Triceps", muscles=["Chest", "Triceps", "Shoulders"]),
    RoutineBlueprint(name="Back And Biceps", muscles=["Back", "Biceps", "Abs"]),
    RoutineBlueprint(name="Shoulders And Core", muscles=["Shoulders", "Abs", "Cardio"]),
    RoutineBlueprint(name="Leg Power Session", muscles=["Legs", "Cardio", "Abs"]),
    RoutineBlueprint(name="Full Body Builder", muscles=["Chest", "Back", "Legs", "Shoulders", "Abs"]),
    RoutineBlueprint(name="Hypertrophy Mix", muscles=["Chest", "Back", "Biceps", "Triceps", "Legs"]),
]


def weight_range_for_muscle(muscle: str) -> tuple[int, int]:
    ranges = {
        "Chest": (30, 75),
        "Back": (35, 85),
        "Shoulders": (15, 45),
        "Biceps": (10, 30),
        "Triceps": (12, 35),
        "Legs": (40, 120),
        "Abs": (10, 30),
        "Cardio": (0, 0),
    }
    return ranges.get(muscle, (15, 45))


def build_set_rows(muscle: str, rng: random.Random) -> list[dict]:
    if muscle == "Cardio":
        return [
            {"kg": 1, "reps": rng.randint(12, 20)},
            {"kg": 1, "reps": rng.randint(12, 20)},
            {"kg": 1, "reps": rng.randint(12, 20)},
        ]

    low, high = weight_range_for_muscle(muscle)
    base = rng.randint(low, high)
    return [
        {"kg": max(1, base - 5), "reps": rng.randint(8, 12)},
        {"kg": base, "reps": rng.randint(8, 12)},
        {"kg": base + rng.randint(0, 5), "reps": rng.randint(6, 10)},
    ]


def pick_exercises_for_template(
    exercises_by_muscle: dict[str, list[dict]],
    blueprint: RoutineBlueprint,
    rng: random.Random,
) -> list[dict]:
    picked: list[dict] = []
    used_ids: set[str] = set()

    for muscle in blueprint.muscles:
        pool = exercises_by_muscle.get(muscle, [])
        if not pool:
            continue
        candidate = rng.choice(pool)
        if candidate["id"] in used_ids:
            continue
        used_ids.add(candidate["id"])
        picked.append({
            "id": candidate["id"],
            "name": candidate["name"],
            "muscle": candidate["muscle"],
        })

    if len(picked) < 3:
        fallback_pool = [ex for vals in exercises_by_muscle.values() for ex in vals]
        rng.shuffle(fallback_pool)
        for ex in fallback_pool:
            if ex["id"] in used_ids:
                continue
            used_ids.add(ex["id"])
            picked.append({
                "id": ex["id"],
                "name": ex["name"],
                "muscle": ex["muscle"],
            })
            if len(picked) >= 4:
                break

    return picked[:5]


def build_history_exercises(template_exercises: list[dict], rng: random.Random) -> tuple[list[dict], int, int]:
    history_exercises: list[dict] = []
    total_sets = 0
    total_volume = 0

    for ex in template_exercises:
        sets = build_set_rows(ex["muscle"], rng)
        total_sets += len(sets)
        for row in sets:
            total_volume += int(row["kg"]) * int(row["reps"])
        history_exercises.append(
            {
                "id": ex["id"],
                "name": ex["name"],
                "muscle": ex["muscle"],
                "sets": sets,
            }
        )

    return history_exercises, total_sets, total_volume


async def main() -> None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    users_col = db["users"]
    exercises_col = db["exercises"]
    templates_col = db["workout_templates"]
    history_col = db["workout_history"]

    users = await users_col.find({"role": {"$ne": "admin"}}, {"_id": 0, "id": 1, "username": 1}).to_list(length=None)
    exercises = await exercises_col.find({}, {"_id": 0, "id": 1, "name": 1, "muscle": 1}).to_list(length=None)

    exercises_by_muscle: dict[str, list[dict]] = {}
    for ex in exercises:
        exercises_by_muscle.setdefault(ex["muscle"], []).append(ex)

    if not users:
        print("No non-admin users found. Nothing to seed.")
        client.close()
        return

    created_templates = 0
    created_history = 0

    for user in users:
        user_id = user["id"]
        rng = random.Random(user_id)

        existing_templates = await templates_col.find({"user_id": user_id}, {"_id": 0, "name": 1, "exercises": 1}).to_list(length=None)
        existing_template_names = {t["name"] for t in existing_templates}

        needed_templates = max(0, TARGET_TEMPLATES_PER_USER - len(existing_templates))
        for blueprint in BLUEPRINTS:
            if needed_templates <= 0:
                break
            if blueprint.name in existing_template_names:
                continue

            template_exercises = pick_exercises_for_template(exercises_by_muscle, blueprint, rng)
            if not template_exercises:
                continue

            await templates_col.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": blueprint.name,
                    "exercises": template_exercises,
                    "updated_at": datetime.now(timezone.utc),
                    "seeded": True,
                }
            )
            existing_templates.append({"name": blueprint.name, "exercises": template_exercises})
            existing_template_names.add(blueprint.name)
            created_templates += 1
            needed_templates -= 1

        history_count = await history_col.count_documents({"user_id": user_id})
        needed_history = max(0, TARGET_HISTORY_PER_USER - history_count)

        if needed_history > 0 and existing_templates:
            for i in range(needed_history):
                source_template = existing_templates[i % len(existing_templates)]
                template_name = source_template["name"]
                template_exercises = source_template["exercises"]

                workout_exercises, total_sets, total_volume = build_history_exercises(template_exercises, rng)
                logged_at = datetime.now(timezone.utc) - timedelta(days=(i * 3 + rng.randint(0, 2)))

                await history_col.insert_one(
                    {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "template_name": template_name,
                        "title": f"Workout {logged_at.date().isoformat()}",
                        "exercises": workout_exercises,
                        "total_sets": total_sets,
                        "total_volume": total_volume,
                        "logged_at": logged_at,
                        "seeded": True,
                    }
                )
                created_history += 1

    print(f"Seed complete. Users touched: {len(users)}")
    print(f"Templates created: {created_templates}")
    print(f"History records created: {created_history}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
