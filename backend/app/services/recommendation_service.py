import json
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import RECOMMENDATION_PROMPT_TEMPLATE
from app.database.models import Quiz, Recommendation, StudyPlan, User
from app.services.rag_service import RAGService
from app.utils.logger import get_logger

logger = get_logger()


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def generate_recommendations(self, student_id: int) -> dict:
        student = await self.db.get(User, student_id)
        if not student:
            raise ValueError("Student not found")

        quizzes = await self._get_student_quizzes(student_id)
        study_plans = await self._get_student_plans(student_id)

        # Focus recommendations ONLY on the most recent quiz taken
        recent_quiz = quizzes[0] if quizzes else None
        
        weak_areas = []
        quiz_history = []
        if recent_quiz and recent_quiz.score is not None:
            if recent_quiz.score < 60:
                weak_areas = [recent_quiz.topic]
            quiz_history = [{"topic": recent_quiz.topic, "score": recent_quiz.score}]

        performance_data = self._build_performance_summary(quizzes, study_plans)

        prompt = RECOMMENDATION_PROMPT_TEMPLATE.format(
            performance_data=performance_data,
            weak_areas=json.dumps(weak_areas),
            quiz_history=json.dumps(quiz_history),
        )

        response = self.rag.llm.invoke(prompt)
        rec_data = self._parse_recommendation(response.content)

        rec = Recommendation(
            user_id=student_id,
            recommendation_text=json.dumps(rec_data),
        )
        self.db.add(rec)
        await self.db.flush()

        return rec_data

    async def _get_student_quizzes(self, student_id: int) -> list[Quiz]:
        result = await self.db.execute(
            select(Quiz).where(Quiz.user_id == student_id).order_by(Quiz.created_at.desc())
        )
        return list(result.scalars().all())

    async def _get_student_plans(self, student_id: int) -> list[StudyPlan]:
        result = await self.db.execute(
            select(StudyPlan).where(StudyPlan.user_id == student_id).order_by(StudyPlan.created_at.desc())
        )
        return list(result.scalars().all())

    def _identify_weak_areas(self, quizzes: list[Quiz]) -> list[str]:
        weak = []
        for q in quizzes:
            if q.score is not None and q.score < 60:
                weak.append(q.topic)
        return list(set(weak))

    def _build_performance_summary(self, quizzes: list[Quiz], plans: list[StudyPlan]) -> str:
        summary_parts = []
        if quizzes:
            scores = [q.score for q in quizzes if q.score is not None]
            avg = sum(scores) / len(scores) if scores else 0
            summary_parts.append(f"Average quiz score: {avg:.1f}%")
            summary_parts.append(f"Quizzes taken: {len(quizzes)}")
        if plans:
            summary_parts.append(f"Study plans created: {len(plans)}")
        return "\n".join(summary_parts) if summary_parts else "No performance data available"

    def _parse_recommendation(self, content: str) -> dict:
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                logger.error("Failed to parse recommendation JSON from LLM response")
        raise ValueError("Failed to generate valid recommendation format")

    async def get_recommendations(self, student_id: int) -> list[Recommendation]:
        result = await self.db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == student_id)
            .order_by(Recommendation.created_at.desc())
        )
        return list(result.scalars().all())
