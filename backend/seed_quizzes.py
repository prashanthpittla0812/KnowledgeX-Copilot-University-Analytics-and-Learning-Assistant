from __future__ import annotations

from seed_utils import first_existing, get_session, insert_dynamic, reflect_table, row_by_column


QUIZZES = [
    {
        "title": "Machine Learning Easy Quiz",
        "topic": "Machine Learning",
        "difficulty": "easy",
        "questions": [
            ("Which learning type uses labeled data?", "Supervised learning"),
            ("What is a feature in ML?", "An input variable used by a model"),
            ("Which metric is common for classification?", "Accuracy"),
        ],
    },
    {
        "title": "Deep Learning Medium Quiz",
        "topic": "Deep Learning",
        "difficulty": "medium",
        "questions": [
            ("What is a neural network layer?", "A group of neurons transforming inputs"),
            ("Why are activation functions used?", "To introduce non-linearity"),
            ("What does backpropagation compute?", "Gradients for model parameters"),
        ],
    },
    {
        "title": "Optimization Hard Quiz",
        "topic": "Optimization",
        "difficulty": "hard",
        "questions": [
            ("What problem can a high learning rate cause?", "Divergence or unstable training"),
            ("What is regularization used for?", "Reducing overfitting"),
            ("What does gradient descent minimize?", "A loss or objective function"),
        ],
    },
]


def main() -> None:
    session = get_session()
    try:
        questions_table = reflect_table(session.bind, ["teacher_quiz_questions", "student_quiz_questions", "questions", "quiz_questions", "question"])
        from sqlalchemy import inspect as sa_inspect
        _inspector = sa_inspect(session.bind)
        _fk_refs = set()
        for _fk in _inspector.get_foreign_keys(questions_table.name):
            if _fk.get("referred_table"):
                _fk_refs.add(_fk["referred_table"])
        quizzes_table = None
        for _candidate in ["teacher_quizzes", "quizzes", "student_quizzes", "quiz"]:
            if _candidate in _fk_refs or _candidate in _inspector.get_table_names():
                quizzes_table = reflect_table(session.bind, [_candidate])
                break
        if quizzes_table is None:
            raise RuntimeError("Could not determine quiz table from foreign key references.")

        quiz_title_col = first_existing(quizzes_table, ["title", "name", "quiz_title", "topic", "topic_name"])
        quiz_topic_col = first_existing(quizzes_table, ["topic", "topic_name", "subject"])
        quiz_difficulty_col = first_existing(quizzes_table, ["difficulty", "level"])
        published_col = first_existing(quizzes_table, ["is_published", "published"])
        faculty_col = first_existing(quizzes_table, ["faculty_id", "teacher_id", "created_by", "user_id"])
        teacher_name_col = first_existing(quizzes_table, ["teacher_name", "faculty_name", "created_by_name"])
        num_questions_col = first_existing(quizzes_table, ["num_questions", "question_count", "total_questions"])
        question_type_col = first_existing(quizzes_table, ["question_type", "quiz_type"])
        date_col = first_existing(quizzes_table, ["created_at", "upload_date", "uploaded_at"])

        question_quiz_id_col = first_existing(questions_table, ["quiz_id"])
        question_text_col = first_existing(questions_table, ["question_text", "question", "text"])
        answer_col = first_existing(questions_table, ["correct_answer", "answer", "correct_option"])
        options_col = first_existing(questions_table, ["options", "choices"])
        type_col = first_existing(questions_table, ["question_type", "type"])

        if not quiz_title_col or not question_quiz_id_col or not question_text_col:
            raise RuntimeError("Quiz/question tables are missing required title, quiz_id, or question text columns.")

        faculty_id = None
        try:
            users_table = reflect_table(session.bind, ["users", "user"])
            email_col = first_existing(users_table, ["email", "email_id"])
            faculty = row_by_column(session, users_table, email_col, "faculty1@knowledgex.com") if email_col else None
            faculty_id = faculty.get("id") if faculty else None
        except Exception:
            faculty_id = None

        for quiz in QUIZZES:
            existing = row_by_column(session, quizzes_table, quiz_title_col, quiz["title"])
            if existing:
                quiz_id = existing.get("id") or existing.get("quiz_id")
            else:
                values = {quiz_title_col: quiz["title"]}
                if quiz_topic_col:
                    values[quiz_topic_col] = quiz["topic"]
                if quiz_difficulty_col:
                    values[quiz_difficulty_col] = quiz["difficulty"]
                if published_col:
                    values[published_col] = True
                if faculty_col and faculty_id:
                    values[faculty_col] = faculty_id
                if teacher_name_col:
                    values[teacher_name_col] = "Faculty One"
                if num_questions_col:
                    values[num_questions_col] = len(quiz["questions"])
                if question_type_col:
                    values[question_type_col] = "mcq"
                if date_col:
                    from datetime import datetime
                    values[date_col] = datetime.utcnow()
                quiz_id = insert_dynamic(session, quizzes_table, values)

            for text, answer in quiz["questions"]:
                values = {
                    question_quiz_id_col: quiz_id,
                    question_text_col: text,
                }
                if answer_col:
                    values[answer_col] = answer
                if options_col:
                    values[options_col] = f'["{answer}", "Incorrect option A", "Incorrect option B", "Incorrect option C"]'
                if type_col:
                    values[type_col] = "mcq"
                from datetime import datetime
                values[question_text_col] = text  # ensure question text is set
                insert_dynamic(session, questions_table, values)

        session.commit()
        print(f"Seeded {len(QUIZZES)} quizzes and sample questions.")
    finally:
        session.close()


if __name__ == "__main__":
    main()

