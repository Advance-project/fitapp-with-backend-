from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re


# ── Request schemas ──────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9_]{3,20}", v):
            raise ValueError("Username must be 3-20 characters: letters, numbers, underscores only")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UpdateUserRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.fullmatch(r"[A-Za-z0-9_]{3,20}", v):
            raise ValueError("Username must be 3-20 characters: letters, numbers, underscores only")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters")
            if not re.search(r"[A-Z]", v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not re.search(r"[a-z]", v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
            if not re.search(r"[^A-Za-z0-9]", v):
                raise ValueError("Password must contain at least one special character")
        return v


# ── Response schemas ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str


class AdminUserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    created_at: Optional[str] = None
    password_hash: Optional[str] = None


class AdminUpdateUserRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class FilterOptionsResponse(BaseModel):
    equipment_options: list[str]
    muscle_options: list[str]


class ExerciseResponse(BaseModel):
    id: str
    name: str
    muscle: str
    equipment: str


class LogWorkoutSetDraft(BaseModel):
    id: str
    kg: str
    reps: str
    done: bool = False


class LogWorkoutExerciseDraft(BaseModel):
    id: str
    name: str
    muscle: str
    sets: list[LogWorkoutSetDraft]


class LogWorkoutDraftUpsertRequest(BaseModel):
    exercises: list[LogWorkoutExerciseDraft]
    elapsed_seconds: int = 0


class LogWorkoutDraftResponse(BaseModel):
    user_id: str
    exercises: list[LogWorkoutExerciseDraft]
    elapsed_seconds: int = 0
    updated_at: Optional[datetime] = None


class WorkoutTemplateExercise(BaseModel):
    id: str
    name: str
    muscle: str


class WorkoutTemplateResponse(BaseModel):
    id: str
    name: str
    exercises: list[WorkoutTemplateExercise]
    updated_at: Optional[datetime] = None


class WorkoutHistorySet(BaseModel):
    kg: int
    reps: int


class WorkoutHistoryExercise(BaseModel):
    id: str
    name: str
    muscle: str
    sets: list[WorkoutHistorySet]


class SaveLoggedWorkoutRequest(BaseModel):
    template_name: str
    exercises: list[WorkoutHistoryExercise]


class SaveTemplateRequest(BaseModel):
    name: str
    exercises: list[WorkoutTemplateExercise]


class WorkoutHistoryResponse(BaseModel):
    id: str
    template_name: str
    title: str
    exercises: list[WorkoutHistoryExercise]
    total_sets: int
    total_volume: int
    logged_at: datetime


class GlobalTemplateExercise(BaseModel):
    id: str
    name: str
    muscle: str


class GlobalWorkoutTemplateResponse(BaseModel):
    id: str
    name: str
    target_muscle: str
    exercises: list[GlobalTemplateExercise]
    created_at: Optional[datetime] = None


class SaveGlobalTemplateRequest(BaseModel):
    name: str
    target_muscle: str
    exercises: list[GlobalTemplateExercise]
