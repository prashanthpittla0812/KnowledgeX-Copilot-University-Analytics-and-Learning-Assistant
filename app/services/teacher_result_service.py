from sqlalchemy import text

from app.database.db import SessionLocal


class TeacherResultService:

    def get_results(
        self,
        quiz_id
    ):

        db = SessionLocal()

        try:

            results = db.execute(
                text("""
                    SELECT
                        student_name,
                        total_questions,
                        correct_answers,
                        wrong_answers,
                        score_percentage,
                        submitted_at
                    FROM teacher_quiz_results
                    WHERE quiz_id = :quiz_id
                    ORDER BY score_percentage DESC
                """),
                {
                    "quiz_id": quiz_id
                }
            ).fetchall()

            response = []

            for r in results:

                response.append(
                    {
                        "student_name": r.student_name,
                        "total_questions": r.total_questions,
                        "correct_answers": r.correct_answers,
                        "wrong_answers": r.wrong_answers,
                        "score_percentage": r.score_percentage,
                        "submitted_at": str(r.submitted_at)
                    }
                )

            return {
                "quiz_id": quiz_id,
                "results": response
            }

        finally:

            db.close()


teacher_result_service = TeacherResultService()