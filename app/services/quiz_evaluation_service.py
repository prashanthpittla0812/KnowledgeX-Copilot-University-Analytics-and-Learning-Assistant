from sqlalchemy import text

from app.database.db import SessionLocal


class QuizEvaluationService:

    def evaluate_quiz(
        self,
        quiz_id,
        student_name,
        answers
    ):

        db = SessionLocal()

        correct = 0
        wrong = 0

        for item in answers:

            result = db.execute(
                text(
                    """
                    SELECT answer
                    FROM quiz_questions
                    WHERE id = :question_id
                    """
                ),
                {
                    "question_id": item.question_id
                }
            ).fetchone()

            if not result:
                continue

            correct_answer = result[0]

            if (
                item.selected_answer.strip().upper()
                ==
                correct_answer.strip().upper()
            ):
                correct += 1
            else:
                wrong += 1

        total = correct + wrong

        score = (
            (correct / total) * 100
            if total > 0
            else 0
        )

        db.execute(
            text(
                """
                INSERT INTO quiz_results
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
                """
            ),
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
        db.close()

        return {
            "quiz_id": quiz_id,
            "student_name": student_name,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "score_percentage": score
        }


quiz_evaluation_service = QuizEvaluationService()