import json
import re
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import STUDYPLAN_GENERATION_PROMPT_TEMPLATE
from app.database.models import StudyPlan, User
from app.services.rag_service import RAGService
from app.utils.logger import get_logger

logger = get_logger()


class StudyPlanService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def generate_plan(
        self, user: User, subjects: list[str], exam_date: str, daily_hours: float
    ) -> dict:
        prompt = STUDYPLAN_GENERATION_PROMPT_TEMPLATE.format(
            subjects=subjects,
            exam_date=exam_date,
            daily_hours=daily_hours,
        )

        response = self.rag.llm.invoke(prompt)
        try:
            plan_content = self._parse_plan_response(response.content)
        except ValueError:
            logger.warning("Using fallback study plan because LLM returned invalid JSON")
            plan_content = self._fallback_plan(subjects, exam_date, daily_hours)

        plan_json = json.dumps(plan_content)
        study_plan = StudyPlan(
            user_id=user.id,
            plan_content=plan_json,
        )
        self.db.add(study_plan)
        await self.db.flush()
        await self.db.refresh(study_plan)

        return {
            "id": study_plan.id,
            "plan": plan_content,
            "created_at": study_plan.created_at,
        }

    def _parse_plan_response(self, content: str) -> dict:
        cleaned = content.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        candidates = [cleaned]
        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if json_match:
            candidates.append(json_match.group())

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return self._normalize_plan(parsed)
            except json.JSONDecodeError:
                continue

        logger.error("Failed to parse study plan JSON from LLM response")
        raise ValueError("Failed to generate valid study plan format")

    def _normalize_plan(self, parsed: dict) -> dict:
        plan = parsed.get("plan") if isinstance(parsed.get("plan"), dict) else parsed
        daily_schedule = plan.get("daily_schedule") or plan.get("schedule") or []

        return {
            "plan": {
                "overview": str(plan.get("overview") or "Your personalized study plan is ready."),
                "daily_schedule": [
                    {
                        "day": self._to_int(item.get("day"), index + 1),
                        "date": str(item.get("date") or ""),
                        "subject": str(item.get("subject") or item.get("topic") or "Study Session"),
                        "topics": self._as_list(item.get("topics")),
                        "duration_hours": self._to_float(
                            item.get("duration_hours") or item.get("hours"),
                            1.0,
                        ),
                        "activities": self._as_list(item.get("activities")),
                        "resources": self._as_list(item.get("resources")),
                    }
                    for index, item in enumerate(daily_schedule)
                    if isinstance(item, dict)
                ],
                "tips": self._as_list(plan.get("tips")),
                "milestones": self._as_list(plan.get("milestones")),
            }
        }

    def _as_list(self, value) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []

    def _to_int(self, value, default: int) -> int:
        if value is None:
            return default
        match = re.search(r"\d+", str(value))
        return int(match.group()) if match else default

    def _to_float(self, value, default: float) -> float:
        if value is None:
            return default
        match = re.search(r"\d+(?:\.\d+)?", str(value))
        return float(match.group()) if match else default

    def _fallback_plan(self, subjects: list[str], exam_date: str, daily_hours: float) -> dict:
        try:
            exam = date.fromisoformat(exam_date)
        except ValueError:
            exam = datetime.utcnow().date() + timedelta(days=7)

        today = datetime.utcnow().date()
        study_days = max((exam - today).days, 1)
        subjects = subjects or ["General Revision"]
        schedule = []

        for index in range(study_days):
            subject = subjects[index % len(subjects)]
            schedule.append({
                "day": index + 1,
                "date": (today + timedelta(days=index)).isoformat(),
                "subject": subject,
                "topics": [subject],
                "duration_hours": float(daily_hours),
                "activities": [
                    "Review core concepts",
                    "Practice questions",
                    "Summarize weak points",
                ],
                "resources": [
                    "Class notes",
                    "Uploaded course materials",
                    "Previous quiz feedback",
                ],
            })

        return {
            "plan": {
                "overview": f"A {study_days}-day plan covering {', '.join(subjects)} before the exam.",
                "daily_schedule": schedule,
                "tips": [
                    "Start each session with quick recall before reading notes.",
                    "Use the final session for revision and practice questions.",
                ],
                "milestones": [
                    "Complete one full pass through all subjects.",
                    "Revise weak areas before the exam date.",
                ],
            }
        }

    async def get_user_plans(self, user: User) -> list[StudyPlan]:
        result = await self.db.execute(
            select(StudyPlan)
            .where(StudyPlan.user_id == user.id)
            .order_by(StudyPlan.created_at.desc())
        )
        return list(result.scalars().all())
