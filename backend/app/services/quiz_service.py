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

        correct = 0
        detailed_results = []
        student_answers_log = []

        for i, q in enumerate(questions):
            student_answer = str(answers[i] if i < len(answers) else "")
            correct_answer = str(q.get("correct_answer", ""))
            
            sa_norm = student_answer.strip().lower()
            ca_norm = correct_answer.strip().lower()
            
            is_correct = (sa_norm == ca_norm)
            
            # If the LLM returned "a", "b", "c", "d" as correct_answer but the frontend submitted the full option string
            if not is_correct and len(ca_norm) == 1 and ca_norm in ['a', 'b', 'c', 'd']:
                idx = ord(ca_norm) - ord('a')
                options = q.get("options", [])
                if 0 <= idx < len(options):
                    if sa_norm == str(options[idx]).strip().lower():
                        is_correct = True
                        
            # If the student submitted "a", "b", "c", "d" but the correct_answer is the full string
            if not is_correct and len(sa_norm) == 1 and sa_norm in ['a', 'b', 'c', 'd']:
                idx = ord(sa_norm) - ord('a')
                options = q.get("options", [])
                if 0 <= idx < len(options):
                    if ca_norm == str(options[idx]).strip().lower():
                        is_correct = True
            
            # Better fallback: strip "a)", "b.", etc. and compare exactly
            if not is_correct:
                import re
                sa_stripped = re.sub(r'^[a-d][\.\)]\s*', '', sa_norm).strip()
                ca_stripped = re.sub(r'^[a-d][\.\)]\s*', '', ca_norm).strip()
                if sa_stripped and ca_stripped and sa_stripped == ca_stripped:
                    is_correct = True

            if is_correct:
                correct += 1

            detailed_results.append({
                "question": q.get("question", ""),
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "explanation": q.get("explanation", ""),
                "status": "correct" if is_correct else "incorrect"
            })
            
            student_answers_log.append({
                "selected_answer": student_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct
            })

        score = (correct / len(questions)) * 100 if questions else 0

        quiz.score = score
        quiz_data["student_answers"] = student_answers_log
        quiz.quiz_data = json.dumps(quiz_data)
        
        await self.db.flush()

        return {
            "quiz_id": quiz.id,
            "score": score,
            "total_questions": len(questions),
            "correct_answers": correct,
            "topic": quiz.topic,
            "created_at": quiz.created_at,
            "results": detailed_results
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
