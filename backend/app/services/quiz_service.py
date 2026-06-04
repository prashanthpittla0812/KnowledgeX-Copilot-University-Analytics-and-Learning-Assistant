import json
import re

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import QUIZ_GENERATION_PROMPT_TEMPLATE
from app.config.settings import settings
from app.database.models import Quiz, User
from app.services.rag_service import RAGService
from app.utils.logger import get_logger

logger = get_logger()


class QuizService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def generate_quiz(self, user: User, topic: str, difficulty: str, number_of_questions: int) -> dict:
        prompt = QUIZ_GENERATION_PROMPT_TEMPLATE.format(
            topic=topic,
            difficulty=difficulty,
            number_of_questions=number_of_questions,
        )

        response = self.rag.llm.invoke(prompt)
        quiz_data = self._parse_quiz_response(response.content)

        quiz = Quiz(
            user_id=user.id,
            topic=topic,
            score=None,
            quiz_data=json.dumps(quiz_data),
        )
        self.db.add(quiz)
        await self.db.flush()
        await self.db.refresh(quiz)

        return {"quiz_id": quiz.id, "topic": topic, "difficulty": difficulty, "quiz": quiz_data["quiz"]}

    def _parse_quiz_response(self, content: str) -> dict:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        json_match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        start = content.find('{')
        end = content.rfind('}')
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(content[start:end+1])
            except json.JSONDecodeError:
                pass

        logger.error(f"Failed to parse quiz JSON from LLM response: {content[:200]}")
        raise ValueError("Failed to generate valid quiz format")

    async def submit_quiz_result(self, quiz_id: int, user: User, answers: list[str]) -> dict:
        result = await self.db.execute(
            select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user.id)
        )
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise ValueError("Quiz not found")

        quiz_data = json.loads(quiz.quiz_data) if quiz.quiz_data else {"quiz": []}
        questions = quiz_data.get("quiz", [])

        if len(answers) != len(questions):
            raise ValueError(
                f"Expected {len(questions)} answers, got {len(answers)}"
            )

        correct = sum(
            1 for i, q in enumerate(questions) if i < len(answers) and q["correct_answer"] == answers[i]
        )
        score = (correct / len(questions)) * 100 if questions else 0

        quiz.score = score
        await self.db.flush()

        return {
            "quiz_id": quiz.id,
            "score": score,
            "total_questions": len(questions),
            "correct_answers": correct,
            "topic": quiz.topic,
        }

    async def get_quiz_history(self, user: User) -> list[Quiz]:
        result = await self.db.execute(
            select(Quiz)
            .where(Quiz.user_id == user.id)
            .order_by(Quiz.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all_quizzes(self, skip: int = 0, limit: int = 20) -> tuple[list[Quiz], int]:
        query = select(Quiz).offset(skip).limit(limit).order_by(Quiz.created_at.desc())
        count_query = select(func.count()).select_from(Quiz)
        result = await self.db.execute(query)
        total = await self.db.scalar(count_query)
        return list(result.scalars().all()), total or 0
