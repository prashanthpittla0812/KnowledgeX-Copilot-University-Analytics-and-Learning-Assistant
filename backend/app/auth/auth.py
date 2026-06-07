from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import create_access_token
from app.auth.password import hash_password, verify_password
from app.database.models import User


class InactiveAccountError(ValueError):
    pass

class UnapprovedAccountError(ValueError):
    pass

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(
        self, name: str, email: str, password: str, role: str = "student"
    ) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def authenticate_user(self, email: str, password: str) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise InactiveAccountError("Account is inactive")
        if user.role == "student" and user.status != "APPROVED":
            if user.status == "REJECTED":
                raise UnapprovedAccountError("Your account was rejected by admin")
            raise UnapprovedAccountError("Your account is awaiting admin approval")
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        return user

    def generate_token(self, user: User) -> str:
        return create_access_token(
            data={
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
            }
        )


