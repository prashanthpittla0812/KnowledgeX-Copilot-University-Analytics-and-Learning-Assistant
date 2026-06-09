import asyncio
from app.database.db import async_session_factory
from app.database.models import User
from sqlalchemy import select
from app.schemas.admin_schema import AdminFacultyResponse

async def run():
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.role == "faculty").order_by(User.created_at.desc()))
        users = result.scalars().all()
        for u in users:
            try:
                AdminFacultyResponse.model_validate(u)
            except Exception as e:
                print(f"Error validating user {u.id}:", e)

asyncio.run(run())
