"""Email registration and sign-in."""

import logging

from fastapi import APIRouter, Depends

from app.auth_utils import create_access_token, hash_password, verify_password
from app.database import get_db
from app.deps.auth import get_current_user
from app.exceptions import ValidationError, UnauthorizedError
from app.repositories import users as users_repo
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _user_payload(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, pool=Depends(get_db)):
    existing = await users_repo.get_user_by_email(pool, body.email)
    if existing:
        raise ValidationError("An account with this email already exists")

    user = await users_repo.create_user(
        pool, body.name, body.email, hash_password(body.password)
    )
    token = create_access_token(user["id"], user["email"])
    logger.info("User registered", extra={"email": user["email"]})
    return AuthResponse(access_token=token, user=_user_payload(user))


@router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest, pool=Depends(get_db)):
    user = await users_repo.get_user_by_email(pool, body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise UnauthorizedError("Invalid email or password")

    token = create_access_token(user["id"], user["email"])
    logger.info("User signed in", extra={"email": user["email"]})
    return AuthResponse(access_token=token, user=_user_payload(user))


@router.get("/auth/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], name=user["name"], email=user["email"])
