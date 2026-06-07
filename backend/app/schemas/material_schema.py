from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class MaterialBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    material_type: str


class MaterialCreate(MaterialBase):
    file_url: str
    thumbnail_url: Optional[str] = None


class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    is_active: Optional[bool] = None


class MaterialResponse(MaterialBase):
    id: int
    file_url: str
    thumbnail_url: Optional[str] = None
    faculty_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Optional fields that might be populated later
    faculty_name: Optional[str] = None
    views_count: Optional[int] = 0
    downloads_count: Optional[int] = 0
    is_bookmarked: Optional[bool] = False

    class Config:
        from_attributes = True


class MaterialActivityCreate(BaseModel):
    action_type: str


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
