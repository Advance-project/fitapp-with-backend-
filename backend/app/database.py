from typing import Optional
import uuid

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
