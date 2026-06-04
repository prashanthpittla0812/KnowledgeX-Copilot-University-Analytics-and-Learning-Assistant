import json

from sqlalchemy import text

from app.database.db import SessionLocal

class StudentQuizService:

    def get_quiz(
        self,
        quiz_id
    ):

        db = SessionLocal()

        try:

            questions = db.execute(
                text("""
                    SELECT
                        id,
                        question,
                        options
                    FROM teacher_quiz_questions
                    WHERE quiz_id = :quiz_id
                """),
                {
                    "quiz_id": quiz_id
                }
            ).fetchall()

            result = []

            for q in questions:

                result.append(
                    {
                        "question_id": q.id,
                        "question": q.question,
                        "options": json.loads(q.options)
                        if isinstance(q.options, str)
                        else q.options
                    }
                )

            return {
                "quiz_id": quiz_id,
                "questions": result
            }

        finally:

            db.close()


student_quiz_service = StudentQuizService()