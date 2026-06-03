import json
import re

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
        plan_content = self._parse_plan_response(response.content)

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
        }

    def _parse_plan_response(self, content: str) -> dict:
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                logger.error("Failed to parse study plan JSON from LLM response")
        raise ValueError("Failed to generate valid study plan format")

    async def get_user_plans(self, user: User) -> list[StudyPlan]:
        result = await self.db.execute(
            select(StudyPlan)
            .where(StudyPlan.user_id == user.id)
            .order_by(StudyPlan.created_at.desc())
        )
        return list(result.scalars().all())
