import json
import re

from sqlalchemy import text

from langchain_ollama import OllamaLLM

from app.config.prompts import get_prompt
from app.services.rag_service import retrieve_context
from app.database.db import SessionLocal

class QuizService:
    def __init__(self):
        self.llm = OllamaLLM(
            model="llama3"
        )

    def generate_quiz(
        self,
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
                "message": f"No content found for topic: {topic_name}"
            }

        prompt = get_prompt(
                context=context,
                question_type=question_type,
                difficulty=difficulty,
                num_questions=num_questions
        )

        response = self.llm.invoke(prompt)

        print("\nRAW RESPONSE:")
        print(response)

        json_match = re.search(
            r"\[.*\]",
            response,
            re.DOTALL
        )

        if not json_match:
            return {
                "status": "error",
                "message": "Model did not return valid JSON",
                "raw_response": response
            }

        questions = json.loads(
            json_match.group(0)
        )

        db = SessionLocal()

        db.execute(
            text(
                """
                INSERT INTO quizzes
                (
                    topic_name,
                    question_type,
                    difficulty,
                    num_questions
                )
                VALUES
                (
                    :topic_name,
                    :question_type,
                    :difficulty,
                    :num_questions
                )
                """
            ),
            {
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
                FROM quizzes
                """
            )
        ).scalar()

        for q in questions:

            db.execute(
                text(
                    """
                    INSERT INTO quiz_questions
                    (
                        quiz_id,
                        question_type,
                        question,
                        options,
                        answer
                    )
                    VALUES
                    (
                        :quiz_id,
                        :question_type,
                        :question,
                        :options,
                        :answer
                    )
                    """
                ),
                {
                    "quiz_id": quiz_id,
                    "question_type": question_type,
                    "question": q.get("question", ""),
                    "options": json.dumps(
                        q.get("options", [])
                    ),
                    "answer": q.get("answer", "")
                }
            )

        db.commit()

        db.close()

        return {
            "status": "success",
            "quiz_id": quiz_id,
            "questions": questions
        }

quiz_service = QuizService()