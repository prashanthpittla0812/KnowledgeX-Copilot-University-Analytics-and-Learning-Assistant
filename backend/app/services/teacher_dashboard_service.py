from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import FacultyDocument, QuizAttempt, TeacherQuiz, User
from app.services.learning_gap_service import LearningGapService


class TeacherDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.gap_service = LearningGapService(db)

    async def get_teacher_quizzes(self, teacher_id: int) -> list[dict]:
        user_res = await self.db.execute(select(User.name).where(User.id == teacher_id))
        teacher_name = user_res.scalar_one_or_none()

        query = select(TeacherQuiz)
        if teacher_name:
            query = query.where(
                or_(
                    TeacherQuiz.teacher_id == teacher_id,
                    (TeacherQuiz.teacher_id.is_(None)) & (TeacherQuiz.teacher_name == teacher_name)
                )
            )
        else:
            query = query.where(TeacherQuiz.teacher_id == teacher_id)

        result = await self.db.execute(query.order_by(TeacherQuiz.created_at.desc()))
        quizzes = result.scalars().all()
        return [
            {
                "id": q.id,
                "topic_name": q.topic_name,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "num_questions": q.num_questions,
                "created_at": q.created_at,
            }
            for q in quizzes
        ]

    async def get_teacher_documents(self, teacher_id: int) -> list[dict]:
        result = await self.db.execute(
            select(FacultyDocument)
            .where(FacultyDocument.teacher_id == teacher_id)
            .order_by(FacultyDocument.uploaded_at.desc())
        )
        docs = result.scalars().all()
        return [
            {
                "id": d.id,
                "file_name": d.file_name,
                "topic": d.topic,
                "chunks_count": d.chunks_count,
                "uploaded_at": d.uploaded_at,
            }
            for d in docs
        ]

    async def get_all_quiz_performance(self, teacher_id: int) -> dict:
        user_res = await self.db.execute(select(User.name).where(User.id == teacher_id))
        teacher_name = user_res.scalar_one_or_none()

        query = select(TeacherQuiz)
        if teacher_name:
            query = query.where(
                or_(
                    TeacherQuiz.teacher_id == teacher_id,
                    (TeacherQuiz.teacher_id.is_(None)) & (TeacherQuiz.teacher_name == teacher_name)
                )
            )
        else:
            query = query.where(TeacherQuiz.teacher_id == teacher_id)

        quiz_result = await self.db.execute(query)
        quizzes = quiz_result.scalars().all()
        quiz_ids = [q.id for q in quizzes]

        if not quiz_ids:
            return {
                "total_quizzes": 0,
                "total_attempts": 0,
                "average_score": 0,
                "highest_score": 0,
                "lowest_score": 0,
                "quiz_breakdown": [],
            }

        agg = await self.db.execute(
            select(
                func.avg(QuizAttempt.percentage),
                func.max(QuizAttempt.percentage),
                func.min(QuizAttempt.percentage),
                func.count(QuizAttempt.id),
            ).where(QuizAttempt.quiz_id.in_(quiz_ids))
        )
        row = agg.one()

        breakdown = []
        for q in quizzes:
            qa = await self.db.execute(
                select(
                    func.avg(QuizAttempt.percentage),
                    func.count(QuizAttempt.id),
                ).where(QuizAttempt.quiz_id == q.id)
            )
            q_row = qa.one()
            breakdown.append({
                "quiz_id": q.id,
                "topic": q.topic_name,
                "difficulty": q.difficulty,
                "average_score": round(q_row[0] or 0, 2),
                "total_attempts": q_row[1] or 0,
            })

        return {
            "total_quizzes": len(quizzes),
            "total_attempts": row[3] or 0,
            "average_score": round(row[0] or 0, 2),
            "highest_score": round(row[1] or 0, 2),
            "lowest_score": round(row[2] or 0, 2),
            "quiz_breakdown": breakdown,
        }

    async def get_recent_quiz_rankings(self, teacher_id: int) -> dict:
        user_res = await self.db.execute(select(User.name).where(User.id == teacher_id))
        teacher_name = user_res.scalar_one_or_none()

        query = select(TeacherQuiz)
        if teacher_name:
            query = query.where(
                or_(
                    TeacherQuiz.teacher_id == teacher_id,
                    (TeacherQuiz.teacher_id.is_(None)) & (TeacherQuiz.teacher_name == teacher_name)
                )
            )
        else:
            query = query.where(TeacherQuiz.teacher_id == teacher_id)

        # Get the most recent quiz
        recent_quiz = await self.db.execute(query.order_by(TeacherQuiz.created_at.desc()).limit(1))
        quiz = recent_quiz.scalar_one_or_none()

        if not quiz:
            return {"quiz_topic": None, "top_3": [], "bottom_3": []}

        # Get attempts for this quiz
        attempts_res = await self.db.execute(
            select(
                User.id,
                User.name,
                func.max(QuizAttempt.percentage).label("best_score")
            )
            .join(QuizAttempt, QuizAttempt.student_id == User.id)
            .where(QuizAttempt.quiz_id == quiz.id)
            .where(User.role == "student")
            .group_by(User.id)
        )
        attempts = attempts_res.all()

        if not attempts:
            return {"quiz_topic": quiz.topic_name, "top_3": [], "bottom_3": []}

        # Sort attempts descending
        sorted_attempts = sorted(attempts, key=lambda x: x.best_score, reverse=True)
        
        n_total = len(sorted_attempts)
        if n_total == 0:
            top_3 = []
            bottom_3 = []
        elif n_total == 1:
            top_3 = [{"user_id": sorted_attempts[0].id, "user_name": sorted_attempts[0].name, "score": round(sorted_attempts[0].best_score, 2)}]
            bottom_3 = []
        else:
            # Dynamically split top and bottom
            n_top = min(3, max(1, n_total // 2))
            n_bottom = min(3, n_total - n_top)
            
            top_attempts = sorted_attempts[:n_top]
            # Get bottom attempts and sort them ascending (lowest score first)
            bottom_attempts = sorted_attempts[-n_bottom:]
            bottom_attempts.reverse()
            
            top_3 = [{"user_id": a.id, "user_name": a.name, "score": round(a.best_score, 2)} for a in top_attempts]
            bottom_3 = [{"user_id": a.id, "user_name": a.name, "score": round(a.best_score, 2)} for a in bottom_attempts]

        return {
            "quiz_topic": quiz.topic_name,
            "top_3": top_3,
            "bottom_3": bottom_3
        }
