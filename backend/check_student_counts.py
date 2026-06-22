import asyncio
from sqlalchemy import select, func
from app.database.db import AsyncSessionLocal
from app.database.models import User

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User.department, func.count()).where(User.role == 'student').group_by(User.department))
        print("Student depts:", res.all())
        res2 = await db.execute(select(User.department, func.count()).where(User.role == 'faculty').group_by(User.department))
        print('Faculty depts:', res2.all())

asyncio.run(main())
