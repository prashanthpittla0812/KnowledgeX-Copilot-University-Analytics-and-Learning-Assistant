import asyncio
from app.database.db import async_session_factory
from app.services.attendance_service import AttendanceService

async def run():
    async with async_session_factory() as db:
        stats = await AttendanceService.get_student_stats(db)
        print("At-risk stats:", stats)

asyncio.run(run())
