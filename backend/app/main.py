from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth as auth_router
from app.routes import exercises as exercises_router
from app.routes import filters as filters_router
from app.routes import log_workout as log_workout_router
from app.routes import workouts as workouts_router
from app import database
from app.config import MONGODB_URI, DB_NAME, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
from app.auth_utils import hash_password

# Conditionally import AI router if OPENAI_API_KEY is set
ai_router = None
if os.getenv("OPENAI_API_KEY"):
    from app.routes import ai as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ──
    database.connect(MONGODB_URI, DB_NAME)
    await database.ensure_indexes()
    await database.seed_filter_options()
    await database.seed_exercises()
    await database.seed_admin(
        email=ADMIN_EMAIL,
        username=ADMIN_USERNAME,
        password_hash=hash_password(ADMIN_PASSWORD),
    )
    yield
    # ── shutdown ──
    database.close()


app = FastAPI(title="Fit App API", lifespan=lifespan)

# Allow requests from the React Native / Expo dev client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your domain in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(exercises_router.router)
app.include_router(filters_router.router)
app.include_router(log_workout_router.router)
app.include_router(workouts_router.router)

if ai_router:
    app.include_router(ai_router.router)

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "FastAPI app is running"}
