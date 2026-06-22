import asyncio
from app.database.db import AsyncSessionLocal
from app.services.analytics_service import AnalyticsService

async def run():
    async with AsyncSessionLocal() as db:
        service = AnalyticsService(db)
        gaps = await service.get_learning_gaps()
        print(gaps['student_performance'])

if __name__ == "__main__":
    asyncio.run(run())
