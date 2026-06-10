from __future__ import annotations

from seed_utils import first_existing, get_session, insert_dynamic, reflect_table, row_by_column


ATTEMPTS = [
    ("student1@knowledgex.com", 80),
    ("student2@knowledgex.com", 60),
    ("student3@knowledgex.com", 40),
]

TOPIC_PERFORMANCE = [
    ("Machine Learning", 80),
    ("Deep Learning", 40),
    ("Optimization", 35),
]


def main() -> None:
    session = get_session()
    try:
        users_table = reflect_table(session.bind, ["users", "user"])
        quizzes_table = reflect_table(session.bind, ["teacher_quizzes", "quizzes", "student_quizzes", "quiz"])
        attempts_table = reflect_table(session.bind, ["quiz_attempts", "attempts", "student_quiz_attempts"])

        email_col = first_existing(users_table, ["email", "email_id"])
        quiz_title_col = first_existing(quizzes_table, ["title", "name", "quiz_title"])
        attempt_student_col = first_existing(attempts_table, ["student_id", "user_id"])
        attempt_quiz_col = first_existing(attempts_table, ["quiz_id"])
        score_col = first_existing(attempts_table, ["score", "percentage", "marks"])
        status_col = first_existing(attempts_table, ["status", "attempt_status"])
        total_q_col = first_existing(attempts_table, ["total_questions", "num_questions", "question_count"])
        correct_col = first_existing(attempts_table, ["correct_answers", "correct", "num_correct"])
        wrong_col = first_existing(attempts_table, ["wrong_answers", "wrong", "num_wrong"])
        pct_col = first_existing(attempts_table, ["percentage", "score_percentage"])
        date_col = first_existing(attempts_table, ["submitted_at", "created_at", "attempt_date"])

        if not email_col or not attempt_student_col or not attempt_quiz_col or not score_col:
            raise RuntimeError("Attempt seeding requires users.email, attempts.student_id, attempts.quiz_id, and attempts.score columns.")

        quiz = session.execute(quizzes_table.select().limit(1)).mappings().first()
        if not quiz:
            raise RuntimeError("No quizzes found. Run seed_quizzes.py first.")
        quiz_id = quiz.get("id") or quiz.get("quiz_id")

        for email, score in ATTEMPTS:
            student = row_by_column(session, users_table, email_col, email)
            if not student:
                continue
            student_id = student.get("id") or student.get("user_id")
            values = {
                attempt_student_col: student_id,
                attempt_quiz_col: quiz_id,
                score_col: score,
            }
            if status_col:
                values[status_col] = "completed"
            if total_q_col:
                values[total_q_col] = 10
            if correct_col:
                values[correct_col] = round(score / 10)
            if wrong_col:
                values[wrong_col] = 10 - round(score / 10)
            if pct_col:
                values[pct_col] = float(score)
            if date_col:
                from datetime import datetime
                values[date_col] = datetime.utcnow()
            insert_dynamic(session, attempts_table, values)

        try:
            analytics_table = reflect_table(session.bind, ["topic_performances", "topic_performance", "analytics", "learning_gaps"])
            topic_col = first_existing(analytics_table, ["topic", "topic_name", "subject"])
            performance_col = first_existing(analytics_table, ["performance", "score", "percentage", "accuracy"])
            student_col = first_existing(analytics_table, ["student_id", "user_id"])
            attempt_id_col = first_existing(analytics_table, ["attempt_id"])
            correct_col = first_existing(analytics_table, ["correct", "correct_answers"])
            total_col = first_existing(analytics_table, ["total", "total_questions"])
            first_student = row_by_column(session, users_table, email_col, "student1@knowledgex.com")
            student_id = first_student.get("id") if first_student else None

            if topic_col:
                first_attempt = session.execute(attempts_table.select().limit(1)).mappings().first()
                attempt_id = first_attempt.get("id") if first_attempt else None
                for topic, performance in TOPIC_PERFORMANCE:
                    values = {topic_col: topic}
                    if performance_col:
                        values[performance_col] = performance
                    if student_col and student_id:
                        values[student_col] = student_id
                    if attempt_id_col and attempt_id:
                        values[attempt_id_col] = attempt_id
                    if correct_col:
                        values[correct_col] = round(performance / 10)
                    if total_col:
                        values[total_col] = 10
                    insert_dynamic(session, analytics_table, values)
        except Exception as exc:
            print(f"Skipped analytics seeding: {exc}")

        session.commit()
        print("Seeded sample quiz attempts and learning gap data.")
    finally:
        session.close()


if __name__ == "__main__":
    main()

