import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import LEARNING_GAPS_PROMPT_TEMPLATE
from app.database.models import Document, Quiz, User
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
        quiz_topics = (
            await self.db.execute(
                select(Quiz.topic, func.avg(Quiz.score).label("avg_score"))
                .where(Quiz.score.isnot(None))
                .group_by(Quiz.topic)
            )
        ).all()

        if not quiz_topics:
            return {
                "learning_gaps": [],
                "overall_class_health": "No data available",
                "faculty_recommendations": ["Encourage students to take quizzes"],
            }

        class_performance_data = "\n".join(
            f"Topic: {row.topic}, Average Score: {float(row.avg_score):.1f}%"
            for row in quiz_topics
        )

        prompt = LEARNING_GAPS_PROMPT_TEMPLATE.format(
            class_performance_data=class_performance_data,
        )

        response = self.rag.llm.invoke(prompt)
        content = response.content

        import re
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                logger.error("Failed to parse learning gaps JSON")

        learning_gaps = []
        for row in quiz_topics:
            if float(row.avg_score) < 60:
                learning_gaps.append({
                    "topic": row.topic,
                    "average_score": round(float(row.avg_score), 2),
                    "students_at_risk": [],
                    "recommended_action": f"Schedule review session on {row.topic}",
                })

        return {
            "learning_gaps": learning_gaps,
            "overall_class_health": self._determine_health(quiz_topics),
            "faculty_recommendations": [
                "Focus on topics with average scores below 60%",
                "Provide additional practice materials",
                "Schedule one-on-one sessions for struggling students",
            ],
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
