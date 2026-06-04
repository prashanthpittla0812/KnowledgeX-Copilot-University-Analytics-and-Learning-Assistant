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
        quizzes_table = reflect_table(session.bind, ["quizzes", "quiz"])
        questions_table = reflect_table(session.bind, ["questions", "quiz_questions", "question"])

        quiz_title_col = first_existing(quizzes_table, ["title", "name", "quiz_title"])
        quiz_topic_col = first_existing(quizzes_table, ["topic", "topic_name", "subject"])
        quiz_difficulty_col = first_existing(quizzes_table, ["difficulty", "level"])
        published_col = first_existing(quizzes_table, ["is_published", "published"])
        faculty_col = first_existing(quizzes_table, ["faculty_id", "teacher_id", "created_by", "user_id"])

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
                insert_dynamic(session, questions_table, values)

        session.commit()
        print(f"Seeded {len(QUIZZES)} quizzes and sample questions.")
    finally:
        session.close()


if __name__ == "__main__":
    main()

