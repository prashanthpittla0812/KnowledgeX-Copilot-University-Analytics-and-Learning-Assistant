import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import TeacherQuiz, TeacherQuizQuestion, TeacherQuizResult


class StudentQuizService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_quizzes(self, student=None) -> list:
        result = await self.db.execute(
            select(TeacherQuiz).order_by(TeacherQuiz.created_at.desc())
        )
        all_quizzes = result.scalars().all()

        import re
        import math
        student_year = None
        if student and student.designation:
            match = re.search(r'\d+', student.designation)
            if match:
                student_year = int(match.group())

        quizzes = []
        for q in all_quizzes:
            if q.semester and student_year:
                sem_match = re.search(r'\d+', q.semester)
                if sem_match:
                    sem_num = int(sem_match.group())
                    req_year = math.ceil(sem_num / 2)
                    if req_year != student_year:
                        continue
            quizzes.append(q)

        attempted_quiz_ids = set()
        if student:
            student_id = student.id
            from app.database.models import QuizAttempt, AssessmentSubmission
            attempts_result = await self.db.execute(
                select(QuizAttempt.quiz_id).where(QuizAttempt.student_id == student_id)
            )
            attempted_quiz_ids = set(attempts_result.scalars().all())

            subs_result = await self.db.execute(
                select(AssessmentSubmission.assessment_id).where(AssessmentSubmission.student_id == student_id)
            )
            attempted_quiz_ids.update(subs_result.scalars().all())

        return [
            {
                "id": q.id,
                "teacher_name": q.teacher_name,
                "topic_name": q.topic_name,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "num_questions": q.num_questions,
                "duration_minutes": q.duration_minutes or 60,
                "max_violations": q.max_violations or 3,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "is_completed": q.id in attempted_quiz_ids,
            }
            for q in quizzes
        ]

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

        result = await self.db.execute(
            select(TeacherQuiz)
            .where(TeacherQuiz.id == quiz_id)
        )
        quiz = result.scalar_one_or_none()
        
        return {
            "quiz_id": quiz_id, 
            "topic_name": quiz.topic_name if quiz else None,
            "question_type": quiz.question_type if quiz else None,
            "num_questions": quiz.num_questions if quiz else None,
            "duration_minutes": quiz.duration_minutes if quiz else 60,
            "max_violations": quiz.max_violations if quiz else 3,
            "created_at": quiz.created_at.isoformat() if quiz and quiz.created_at else None,
            "questions": formatted
        }


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
