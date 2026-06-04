from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import TeacherQuizResult


class TeacherResultService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_results(self, quiz_id: int) -> dict:
        result = await self.db.execute(
            select(TeacherQuizResult)
            .where(TeacherQuizResult.quiz_id == quiz_id)
            .order_by(TeacherQuizResult.score_percentage.desc())
        )
        rows = result.scalars().all()

        response = []
        for r in rows:
            response.append({
                "student_name": r.student_name,
                "total_questions": r.total_questions,
                "correct_answers": r.correct_answers,
                "wrong_answers": r.wrong_answers,
                "score_percentage": r.score_percentage,
                "submitted_at": str(r.submitted_at),
            })

        return {"quiz_id": quiz_id, "results": response}
