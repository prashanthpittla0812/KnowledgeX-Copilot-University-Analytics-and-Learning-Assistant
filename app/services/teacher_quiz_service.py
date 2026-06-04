import json
import re

from sqlalchemy import text

from langchain_ollama import OllamaLLM

from app.database.db import SessionLocal

from app.services.rag_service import (
    retrieve_context
)

from app.config.prompts import (
    get_prompt
)


class TeacherQuizService:

    def __init__(self):

        self.llm = OllamaLLM(
            model="llama3"
        )

    def generate_quiz(
        self,
        teacher_name,
        topic_name,
        question_type,
        difficulty,
        num_questions
    ):

        context = retrieve_context(
            topic_name,
            topic_name
        )

        if not context:

            return {
                "status": "error",
                "message": "No content found"
            }

        prompt = get_prompt(
            context=context,
            question_type=question_type,
            difficulty=difficulty,
            num_questions=num_questions
        )

        response = self.llm.invoke(
            prompt
        )

        json_match = re.search(
            r"\[.*\]",
            response,
            re.DOTALL
        )

        if not json_match:

            return {
                "status": "error",
                "message": "Invalid JSON"
            }

        questions = json.loads(
            json_match.group(0)
        )

        db = SessionLocal()

        db.execute(
            text(
                """
                INSERT INTO teacher_quizzes
                (
                    teacher_name,
                    topic_name,
                    question_type,
                    difficulty,
                    num_questions
                )
                VALUES
                (
                    :teacher_name,
                    :topic_name,
                    :question_type,
                    :difficulty,
                    :num_questions
                )
                """
            ),
            {
                "teacher_name": teacher_name,
                "topic_name": topic_name,
                "question_type": question_type,
                "difficulty": difficulty,
                "num_questions": num_questions
            }
        )

        db.commit()

        quiz_id = db.execute(
            text(
                """
                SELECT MAX(id)
                FROM teacher_quizzes
                """
            )
        ).scalar()

        for q in questions:

            db.execute(
                text(
                    """
                    INSERT INTO teacher_quiz_questions
                    (
                        quiz_id,
                        question,
                        options,
                        answer
                    )
                    VALUES
                    (
                        :quiz_id,
                        :question,
                        :options,
                        :answer
                    )
                    """
                ),
                {
                    "quiz_id": quiz_id,
                    "question": q.get(
                        "question",
                        ""
                    ),
                    "options": json.dumps(
                        q.get(
                            "options",
                            []
                        )
                    ),
                    "answer": q.get(
                        "answer",
                        ""
                    )
                }
            )

        db.commit()

        db.close()

        return {
            "status": "success",
            "quiz_id": quiz_id,
            "questions": questions
        }


teacher_quiz_service = TeacherQuizService()