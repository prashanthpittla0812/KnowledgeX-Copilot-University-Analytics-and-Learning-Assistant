from datetime import datetime

from pydantic import BaseModel


class UserDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserDetailResponse]
    total: int
    page: int
    page_size: int
