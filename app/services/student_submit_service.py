from sqlalchemy import text

from app.database.db import SessionLocal


class StudentSubmitService:

    def submit_quiz(
        self,
        quiz_id,
        student_name,
        answers
    ):

        db = SessionLocal()

        try:

            correct = 0

            for answer in answers:

                actual = db.execute(
                    text("""
                        SELECT answer
                        FROM teacher_quiz_questions
                        WHERE id = :question_id
                    """),
                    {
                        "question_id": answer.question_id
                    }
                ).fetchone()

                if actual:

                    if (
                        answer.answer.strip().lower()
                        ==
                        actual.answer.strip().lower()
                    ):
                        correct += 1

            total = len(answers)

            wrong = total - correct

            score = (
                correct / total * 100
                if total > 0
                else 0
            )

            db.execute(
                text("""
                    INSERT INTO teacher_quiz_results
                    (
                        quiz_id,
                        student_name,
                        total_questions,
                        correct_answers,
                        wrong_answers,
                        score_percentage
                    )
                    VALUES
                    (
                        :quiz_id,
                        :student_name,
                        :total_questions,
                        :correct_answers,
                        :wrong_answers,
                        :score_percentage
                    )
                """),
                {
                    "quiz_id": quiz_id,
                    "student_name": student_name,
                    "total_questions": total,
                    "correct_answers": correct,
                    "wrong_answers": wrong,
                    "score_percentage": score
                }
            )

            db.commit()

            return {
                "quiz_id": quiz_id,
                "student_name": student_name,
                "correct_answers": correct,
                "wrong_answers": wrong,
                "score_percentage": score
            }

        finally:

            db.close()


student_submit_service = StudentSubmitService()