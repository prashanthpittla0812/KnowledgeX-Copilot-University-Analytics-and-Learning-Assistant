from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user_schema import UserDetailResponse as UserResponse


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"student", "faculty", "admin"}
        if v.lower() not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v.lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
