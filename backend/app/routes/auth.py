from fastapi import APIRouter, Depends, HTTPException, status

from .. import database
from ..auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
)
from ..models import (
    SignupRequest,
    LoginRequest,
    AdminLoginRequest,
    RefreshTokenRequest,
    UpdateUserRequest,
    UserResponse,
    TokenResponse,
    RefreshResponse,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _to_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        role=user["role"],
    )


# ── POST /auth/signup ─────────────────────────────────────────────────────────

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(payload: SignupRequest):
    if await database.get_user_by_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = await database.create_user(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    access_token = create_access_token({"sub": user["id"]})
    refresh_token = create_refresh_token({"sub": user["id"]})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_user_response(user),
    )


# ── POST /auth/login ──────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
async def login(payload: LoginRequest):
    user = await database.get_user_by_email(payload.email)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token({"sub": user["id"]})
    refresh_token = create_refresh_token({"sub": user["id"]})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_user_response(user),
    )


# ── POST /auth/admin-login ────────────────────────────────────────────────────

@router.post(
    "/admin-login",
    response_model=TokenResponse,
    summary="Admin login — username + password, role must be admin",
)
async def admin_login(payload: AdminLoginRequest):
    user = await database.get_user_by_username(payload.username)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not an admin account",
        )
    access_token = create_access_token({"sub": user["id"]})
    refresh_token = create_refresh_token({"sub": user["id"]})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_user_response(user),
    )


# ── POST /auth/refresh ────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Exchange a valid refresh token for a new token pair",
)
async def refresh_tokens(payload: RefreshTokenRequest):
    decoded = decode_refresh_token(payload.refresh_token)
    if decoded is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id: str | None = decoded.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )

    user = await database.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for refresh token",
        )

    return RefreshResponse(
        access_token=create_access_token({"sub": user["id"]}),
        refresh_token=create_refresh_token({"sub": user["id"]}),
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user's profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _to_user_response(current_user)


# ── PUT /auth/me ──────────────────────────────────────────────────────────────

@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update the currently authenticated user's username or password",
)
async def update_me(
    payload: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    if payload.username is None and payload.password is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one field to update (username or password)",
        )

    fields: dict = {}
    if payload.username is not None:
        fields["username"] = payload.username
    if payload.password is not None:
        fields["password_hash"] = hash_password(payload.password)

    updated = await database.update_user(current_user["id"], fields)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _to_user_response(updated)


# ── DELETE /auth/me ───────────────────────────────────────────────────────────

@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete the currently authenticated user's account",
)
async def delete_me(current_user: dict = Depends(get_current_user)):
    deleted = await database.delete_user(current_user["id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
