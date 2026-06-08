import asyncio
from app.database.db import async_session_factory
from app.database.models import User, Attendance
from sqlalchemy import select

async def run():
    async with async_session_factory() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        print("Users:", [{'id': u.id, 'name': u.name, 'role': u.role} for u in users])
        
        res = await db.execute(select(Attendance))
        attendances = res.scalars().all()
        print("Attendances:", [{'id': a.id, 'student_id': a.student_id, 'status': a.status} for a in attendances])

asyncio.run(run())
