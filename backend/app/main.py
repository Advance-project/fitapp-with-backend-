from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth as auth_router
from app import database
from app.config import MONGODB_URI, DB_NAME, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
from app.auth_utils import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ──
    database.connect(MONGODB_URI, DB_NAME)
    await database.ensure_indexes()
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


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "FastAPI app is running"}
