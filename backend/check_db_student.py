import asyncio
from sqlalchemy import select
from app.database.db import SessionLocal
from app.database.models import User

async def run():
    async with SessionLocal() as db:
        users = (await db.execute(select(User.id, User.name, User.email, User.department, User.designation).where(User.name == 'student'))).all()
        for u in users:
            print(f"id={u.id}, name={u.name}, email={u.email}, dept={u.department}, desg={u.designation}")

if __name__ == "__main__":
    asyncio.run(run())
