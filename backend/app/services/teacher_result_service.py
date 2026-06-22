from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import QuizAttempt, User


class TeacherResultService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_results(self, quiz_id: int) -> dict:
        result = await self.db.execute(
            select(QuizAttempt, User)
            .join(User, QuizAttempt.student_id == User.id)
            .where(QuizAttempt.quiz_id == quiz_id)
            .order_by(QuizAttempt.percentage.desc())
        )
        rows = result.all()

        response = []
        for attempt, user in rows:
            response.append({
                "student_name": user.name,
                "total_questions": attempt.total_questions,
                "correct_answers": attempt.correct_answers,
                "wrong_answers": attempt.wrong_answers,
                "score_percentage": attempt.percentage,
                "submitted_at": str(attempt.submitted_at),
            })

        summary = await self.db.execute(
            select(
                func.avg(QuizAttempt.percentage),
                func.max(QuizAttempt.percentage),
                func.min(QuizAttempt.percentage),
                func.count(QuizAttempt.id),
            ).where(QuizAttempt.quiz_id == quiz_id)
        )
        s_row = summary.one()

        return {
            "quiz_id": quiz_id,
            "results": response,
            "average_score": round(s_row[0] or 0, 2),
            "highest_score": round(s_row[1] or 0, 2),
            "lowest_score": round(s_row[2] or 0, 2),
            "total_attempts": s_row[3] or 0,
        }
