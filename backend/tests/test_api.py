import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient() as client:
        # We need a valid token. Or we can just use the internal TeacherDashboardService.
        from app.database.db import async_session_factory
        from app.services.teacher_dashboard_service import TeacherDashboardService
        
        async with async_session_factory() as db:
            service = TeacherDashboardService(db)
            quizzes = await service.get_teacher_quizzes(5)
            print("Quizzes:", quizzes)

asyncio.run(main())
