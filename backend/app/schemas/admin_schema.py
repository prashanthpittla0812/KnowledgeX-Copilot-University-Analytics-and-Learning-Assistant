from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class FacultyCreateRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str

class FacultyCreateResponse(BaseModel):
    id: int
    name: str
    email: str
    temporary_password: str

class AdminStudentResponse(BaseModel):
    id: int
    name: str
    email: str
    email_type: Optional[str] = None
    department: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AdminFacultyResponse(BaseModel):
    id: int
    name: str
    email: str
    department: Optional[str]
    designation: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminResetPasswordResponse(BaseModel):
    id: int
    new_password: str

class AuditLogResponse(BaseModel):
    id: int
    action: str
    performed_by_name: str
    target_user_name: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class AdminDashboardAnalytics(BaseModel):
    total_students: int
    approved_students: int
    pending_students: int
    rejected_students: int
    total_faculty: int
    active_faculty: int
    total_quizzes: int
    total_quiz_attempts: int
    average_performance: float
