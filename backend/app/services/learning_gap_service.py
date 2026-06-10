import json

from langchain.chat_models import init_chat_model
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import LEARNING_GAPS_PROMPT_TEMPLATE
from app.config.settings import settings
from app.database.models import (
    LearningGapReport,
    QuizAttempt,
    TeacherQuiz,
    TopicPerformance,
    User,
)
from app.utils.logger import get_logger

logger = get_logger()


class LearningGapService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = self._init_llm()

    def _init_llm(self):
        if settings.AI_PROVIDER == "openai":
            return init_chat_model(
                settings.OPENAI_MODEL,
                model_provider="openai",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
        elif settings.AI_PROVIDER == "azure":
            return init_chat_model(
                settings.AZURE_OPENAI_DEPLOYMENT,
                model_provider="azure_openai",
                api_key=settings.AZURE_OPENAI_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.3,
            )
        elif settings.AI_PROVIDER == "groq":
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
            )
        else:
            return init_chat_model(
                settings.OLLAMA_MODEL,
                model_provider="ollama",
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.3,
            )

    async def get_learning_gaps(self, quiz_id: int) -> dict:
        result = await self.db.execute(
            select(TopicPerformance).where(
                TopicPerformance.quiz_id == QuizAttempt.quiz_id,
                QuizAttempt.quiz_id == quiz_id,
            ).join(QuizAttempt, TopicPerformance.attempt_id == QuizAttempt.id)
        )
        performances = result.scalars().all()

        topic_stats: dict[str, dict] = {}
        for tp in performances:
            key = tp.topic
            if key not in topic_stats:
                topic_stats[key] = {"total_correct": 0, "total_questions": 0, "student_ids": set()}
            topic_stats[key]["total_correct"] += tp.correct
            topic_stats[key]["total_questions"] += tp.total

        gaps = []
        for topic, stats in topic_stats.items():
            struggling_pct = 0
            if stats["total_questions"] > 0:
                class_avg = (stats["total_correct"] / stats["total_questions"]) * 100
                struggling_pct = round(100 - class_avg, 2)

            gaps.append({
                "topic": topic,
                "struggling_percentage": struggling_pct,
                "total_students": 0,
                "struggling_count": 0,
            })

        gaps.sort(key=lambda x: x["struggling_percentage"], reverse=True)
        return {"gaps": gaps}

    async def get_class_insights(self, quiz_id: int, teacher_id: int) -> dict:
        result = await self.db.execute(
            select(TopicPerformance).where(
                TopicPerformance.quiz_id == QuizAttempt.quiz_id,
                QuizAttempt.quiz_id == quiz_id,
            ).join(QuizAttempt, TopicPerformance.attempt_id == QuizAttempt.id)
        )
        performances = result.scalars().all()

        topic_stats: dict[str, dict] = {}
        for tp in performances:
            key = tp.topic
            if key not in topic_stats:
                topic_stats[key] = {"total_correct": 0, "total_questions": 0}
            topic_stats[key]["total_correct"] += tp.correct
            topic_stats[key]["total_questions"] += tp.total

        strong = []
        weak = []
        for topic, stats in topic_stats.items():
            acc = (stats["total_correct"] / stats["total_questions"] * 100) if stats["total_questions"] > 0 else 0
            acc = round(acc, 2)
            status = "strong" if acc >= 70 else ("moderate" if acc >= 50 else "weak")
            item = {"topic": topic, "class_accuracy": acc, "status": status}
            if acc >= 70:
                strong.append(item)
            else:
                weak.append(item)

        weak.sort(key=lambda x: x["class_accuracy"])
        strong.sort(key=lambda x: x["class_accuracy"], reverse=True)

        revision_topics = [w["topic"] for w in weak]

        ai_recommendations = await self._generate_ai_recommendations(quiz_id, weak, strong)

        report = LearningGapReport(
            teacher_id=teacher_id,
            quiz_id=quiz_id,
            report_data=json.dumps({
                "weak_topics": weak,
                "strong_topics": strong,
                "revision_topics": revision_topics,
            }),
            ai_recommendations=json.dumps(ai_recommendations) if ai_recommendations else None,
        )
        self.db.add(report)
        await self.db.flush()

        return {
            "strong_topics": strong,
            "weak_topics": weak,
            "recommended_revision_topics": revision_topics,
            "ai_recommendations": ai_recommendations,
        }

    async def _generate_ai_recommendations(self, quiz_id: int, weak_topics: list, strong_topics: list) -> str | None:
        if not weak_topics:
            return None

        quiz = await self.db.get(TeacherQuiz, quiz_id)
        topic_name = quiz.topic_name if quiz else "Unknown"

        class_data = {
            "topic": topic_name,
            "weak_areas": [w["topic"] for w in weak_topics],
            "strong_areas": [s["topic"] for s in strong_topics],
            "weak_details": weak_topics,
        }

        prompt = f"""You are an expert educational analyst. Based on the following class performance data, generate actionable recommendations for the teacher.

Class Performance Data:
{json.dumps(class_data, indent=2)}

Generate 3-5 specific, actionable recommendations for the teacher. Each recommendation should be a clear sentence.

Return ONLY valid JSON in this exact format:
{{
  "recommendations": [
    "Recommendation 1 with specific topic references and suggested actions.",
    "Recommendation 2 with specific topic references and suggested actions."
  ]
}}"""

        try:
            response = await self.llm.ainvoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            import re
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                recs = data.get("recommendations", [])
                if recs:
                    return "\n".join(f"{i+1}. {r}" for i, r in enumerate(recs))
        except Exception as e:
            logger.error(f"AI recommendation generation failed: {e}")

        fallback = []
        for w in weak_topics[:3]:
            fallback.append(f"Schedule a revision session on {w['topic']} where the class accuracy is only {w['class_accuracy']}%.")
        if fallback:
            return "\n".join(f"{i+1}. {r}" for i, r in enumerate(fallback))
        return None

    async def get_class_performance(self, quiz_id: int) -> dict:
        result = await self.db.execute(
            select(
                func.avg(QuizAttempt.percentage),
                func.max(QuizAttempt.percentage),
                func.min(QuizAttempt.percentage),
                func.count(QuizAttempt.id),
                func.count(func.distinct(QuizAttempt.student_id)),
            ).where(QuizAttempt.quiz_id == quiz_id)
        )
        row = result.one()
        return {
            "average_score": round(row[0] or 0, 2),
            "highest_score": round(row[1] or 0, 2),
            "lowest_score": round(row[2] or 0, 2),
            "total_attempts": row[3] or 0,
            "total_students": row[4] or 0,
        }
