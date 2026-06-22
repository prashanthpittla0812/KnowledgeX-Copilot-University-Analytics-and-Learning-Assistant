import asyncio
from app.database.db import AsyncSessionLocal
from app.database.models import User
from app.services.analytics_service import AnalyticsService
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        faculty = await db.scalar(select(User).where(User.role == 'faculty', User.department == 'cse'))
        print("Faculty:", faculty.name, faculty.department)
        service = AnalyticsService(db)
        stats = await service.get_dashboard_stats(faculty=faculty)
        print("Stats:", stats)

asyncio.run(main())
