import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "fit_app")
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-use-env-var")
