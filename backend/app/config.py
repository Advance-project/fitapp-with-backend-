import os
from dotenv import load_dotenv

load_dotenv(override=True)

MONGODB_URI: str = (os.getenv("MONGODB_URI", "").strip() or "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "fit_app")
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-use-env-var")
OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

# ── Admin seed credentials (override via .env in production) ──────────────────
ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@fitapp.local")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
