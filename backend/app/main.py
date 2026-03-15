from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth as auth_router
from app import database
from app.config import MONGODB_URI, DB_NAME


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ──
    database.connect(MONGODB_URI, DB_NAME)
    await database.ensure_indexes()
    yield
    # ── shutdown ──
    database.close()


app = FastAPI(title="Fit App API", lifespan=lifespan)

# Allow requests from the React Native / Expo dev client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "FastAPI app is running"}
