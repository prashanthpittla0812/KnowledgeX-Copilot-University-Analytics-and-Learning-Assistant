from datetime import datetime

from typing import Optional

from pydantic import BaseModel, EmailStr


class UserDetailResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    status: Optional[str] = None
    must_change_password: Optional[bool] = False
    created_at: datetime
    department: Optional[str] = None
    designation: Optional[str] = None
    profile_photo_path: Optional[str] = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None


class UserListResponse(BaseModel):
    users: list[UserDetailResponse]
    total: int
    page: int
    page_size: int
