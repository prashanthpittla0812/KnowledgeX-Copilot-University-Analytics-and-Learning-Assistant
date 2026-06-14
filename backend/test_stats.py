import asyncio
from app.database.session import AsyncSessionLocal
from app.services.analytics_service import AnalyticsService

async def main():
    async with AsyncSessionLocal() as db:
        service = AnalyticsService(db)
        stats = await service.get_dashboard_stats()
        print(stats)

asyncio.run(main())
