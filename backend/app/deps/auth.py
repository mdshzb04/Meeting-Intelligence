"""Auth dependencies for protected routes."""

from fastapi import Depends, Header

from app.auth_utils import decode_access_token
from app.database import get_db
from app.exceptions import UnauthorizedError
from app.repositories import users as users_repo


async def get_current_user(
    authorization: str | None = Header(None),
    pool=Depends(get_db),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing authorization")
    payload = decode_access_token(authorization[7:])
    if not payload or not payload.get("sub"):
        raise UnauthorizedError("Invalid or expired token")
    user = await users_repo.get_user_by_id(pool, payload["sub"])
    if not user:
        raise UnauthorizedError("User not found")
    return user
