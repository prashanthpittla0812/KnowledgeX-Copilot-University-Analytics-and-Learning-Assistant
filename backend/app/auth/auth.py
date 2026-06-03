from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import create_access_token, decode_access_token
from app.auth.password import hash_password, verify_password
from app.database.models import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(
        self, name: str, email: str, password: str, role: str = "student"
    ) -> User:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
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
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        return user

    def generate_token(self, user: User) -> str:
        return create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )

    @staticmethod
    def verify_token(token: str) -> dict | None:
        return decode_access_token(token)
