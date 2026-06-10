from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import StudentTopicSummary, User
from app.services.assessment_service import AssessmentService


class StudentDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.assessment = AssessmentService(db)

    async def get_results(self, student_id: int) -> dict:
        return await self.assessment.get_student_results(student_id)

    async def get_recommendations(self, student_id: int) -> dict:
        return await self.assessment.get_student_recommendations(student_id)

    async def get_profile_summary(self, student_id: int) -> dict:
        user = await self.db.get(User, student_id)
        if not user:
            raise ValueError("Student not found")

        result = await self.db.execute(
            select(StudentTopicSummary).where(
                StudentTopicSummary.student_id == student_id
            )
        )
        summaries = result.scalars().all()

        weak_count = sum(1 for s in summaries if s.average_accuracy < 60)
        strong_count = sum(1 for s in summaries if s.average_accuracy >= 80)
        total_topics = len(summaries)
        overall_avg = (
            round(sum(s.average_accuracy for s in summaries) / total_topics, 2)
            if total_topics > 0 else 0
        )

        return {
            "name": user.name,
            "email": user.email,
            "weak_areas_count": weak_count,
            "strong_areas_count": strong_count,
            "total_topics_tracked": total_topics,
            "overall_average_accuracy": overall_avg,
        }
