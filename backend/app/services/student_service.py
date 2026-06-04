import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import TeacherQuizQuestion, TeacherQuizResult


class StudentQuizService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_quiz(self, quiz_id: int) -> dict:
        result = await self.db.execute(
            select(TeacherQuizQuestion)
            .where(TeacherQuizQuestion.quiz_id == quiz_id)
        )
        questions = result.scalars().all()

        formatted = []
        for q in questions:
            options = q.options
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except (json.JSONDecodeError, TypeError):
                    options = []
            formatted.append({
                "question_id": q.id,
                "question": q.question,
                "options": options,
            })

        return {"quiz_id": quiz_id, "questions": formatted}


class StudentSubmitService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_quiz(
        self,
        quiz_id: int,
        student_name: str,
        answers: list,
    ) -> dict:
        correct = 0
        for answer in answers:
            result = await self.db.execute(
                select(TeacherQuizQuestion)
                .where(TeacherQuizQuestion.id == answer.question_id)
            )
            actual = result.scalar_one_or_none()
            if actual and answer.answer.strip().lower() == actual.answer.strip().lower():
                correct += 1

        total = len(answers)
        wrong = total - correct
        score = (correct / total * 100) if total > 0 else 0

        quiz_result = TeacherQuizResult(
            quiz_id=quiz_id,
            student_name=student_name,
            total_questions=total,
            correct_answers=correct,
            wrong_answers=wrong,
            score_percentage=score,
        )
        self.db.add(quiz_result)
        await self.db.flush()

        return {
            "quiz_id": quiz_id,
            "student_name": student_name,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "score_percentage": score,
        }
