# Development authentication helper
import os

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from src.database.base import get_db
from src.database.models import User

from .auth import get_current_user as get_prod_user


async def get_current_user_optional(
    authorization: str | None = Header(None),
    token: str | None = None,
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user for development - returns None if not authenticated."""
    # In development mode, always return None to bypass authentication
    # This allows the chat to work without any authentication
    if os.getenv("NODE_ENV") == "development":
        return None

    # Otherwise, use production authentication
    try:
        return await get_prod_user(authorization=authorization, token=token, db=db)
    except:
        raise


# For development, we can use optional authentication
def get_current_active_user_dev(
    current_user: User | None = Depends(get_current_user_optional)
) -> User | None:
    """Get current active user for development - returns None if not authenticated."""
    return current_user
