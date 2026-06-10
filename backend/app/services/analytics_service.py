import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import LEARNING_GAPS_PROMPT_TEMPLATE
from app.database.models import Document, FacultyDocument, Quiz, QuizAttempt, TeacherQuiz, User, TopicPerformance
from app.services.rag_service import RAGService
from app.utils.logger import get_logger

logger = get_logger()


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def get_dashboard_stats(self) -> dict:
        total_students = await self.db.scalar(
            select(func.count()).select_from(User).where(User.role == "student")
        )
        total_faculty = await self.db.scalar(
            select(func.count()).select_from(User).where(User.role == "faculty")
        )
        total_documents = await self.db.scalar(
            select(func.count()).select_from(Document)
        )
        total_quizzes = await self.db.scalar(
            select(func.count()).select_from(Quiz)
        )
        return {
            "total_students": total_students or 0,
            "total_faculty": total_faculty or 0,
            "total_documents": total_documents or 0,
            "total_quizzes": total_quizzes or 0,
        }

    async def get_performance_metrics(self) -> list[dict]:
        users_with_quizzes = (
            await self.db.execute(
                select(
                    User.id,
                    User.name,
                    func.avg(Quiz.score).label("average_score"),
                    func.count(Quiz.id).label("quizzes_taken"),
                )
                .join(Quiz, Quiz.user_id == User.id, isouter=True)
                .group_by(User.id)
            )
        ).all()

        metrics = []
        for row in users_with_quizzes:
            doc_count = await self.db.scalar(
                select(func.count()).select_from(Document).where(Document.user_id == row.id)
            )
            metrics.append({
                "user_id": row.id,
                "user_name": row.name,
                "average_score": round(float(row.average_score), 2) if row.average_score else 0.0,
                "quizzes_taken": row.quizzes_taken or 0,
                "documents_uploaded": doc_count or 0,
            })
        return metrics

    async def get_learning_gaps(self) -> dict:
        student_query = await self.db.execute(
            select(User.name, func.avg(QuizAttempt.percentage).label("avg_score"))
            .join(QuizAttempt, User.id == QuizAttempt.student_id)
            .group_by(User.name)
        )
        student_scores = student_query.all()

        topic_query = await self.db.execute(
            select(TopicPerformance.topic, func.avg(TopicPerformance.accuracy).label("avg_acc"))
            .group_by(TopicPerformance.topic)
        )
        topic_scores = topic_query.all()

        student_performance = [
            {"student_name": row.name, "average_score": round(float(row.avg_score), 2)}
            for row in student_scores
        ]

        weak_topics = []
        strong_topics = []
        for row in topic_scores:
            acc = round(float(row.avg_acc), 2)
            item = {"topic": row.topic, "average_accuracy": acc}
            if acc < 60:
                weak_topics.append(item)
            else:
                strong_topics.append(item)

        return {
            "student_performance": student_performance,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "overall_class_health": "Good" if len(strong_topics) >= len(weak_topics) else "Needs Attention",
            "faculty_recommendations": [
                f"Review {wt['topic']} as class average is {wt['average_accuracy']}%" for wt in weak_topics
            ] or ["Keep up the good work! Class is performing well."]
        }

    async def get_admin_system_stats(self) -> dict:
        total_students = await self.db.scalar(
            select(func.count()).select_from(User).where(User.role == "student")
        )
        total_faculty = await self.db.scalar(
            select(func.count()).select_from(User).where(User.role == "faculty")
        )
        total_quizzes_generated = await self.db.scalar(
            select(func.count()).select_from(TeacherQuiz)
        )
        total_quizzes_attempted = await self.db.scalar(
            select(func.count()).select_from(QuizAttempt)
        )
        avg_perf = await self.db.scalar(
            select(func.avg(QuizAttempt.percentage))
        )
        return {
            "total_students": total_students or 0,
            "total_faculty": total_faculty or 0,
            "total_quizzes_generated": total_quizzes_generated or 0,
            "total_quizzes_attempted": total_quizzes_attempted or 0,
            "average_performance": round(avg_perf or 0, 2),
        }

    def _determine_health(self, quiz_topics: list) -> str:
        if not quiz_topics:
            return "No data"
        scores = [float(r.avg_score) for r in quiz_topics]
        avg = sum(scores) / len(scores)
        if avg >= 80:
            return "Excellent"
        elif avg >= 65:
            return "Good"
        elif avg >= 50:
            return "Average"
        return "Poor"
