from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserDetailResponse]
    total: int
    page: int
    page_size: int
