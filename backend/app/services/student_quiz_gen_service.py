import json
import re

from langchain.chat_models import init_chat_model
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import (
    TEACHER_FILL_BLANKS_PROMPT_TEMPLATE,
    TEACHER_MCQ_PROMPT_TEMPLATE,
    TEACHER_MIXED_PROMPT_TEMPLATE,
    TEACHER_THEORY_PROMPT_TEMPLATE,
)
from app.config.settings import settings
from app.database.models import StudentQuiz, StudentQuizQuestion, StudentQuizResult
from app.services.teacher_chroma_service import retrieve_context
from app.utils.logger import get_logger

logger = get_logger()


class StudentQuizGenService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = self._init_llm()

    def _init_llm(self):
        if settings.AI_PROVIDER == "openai":
            return init_chat_model(
                settings.OPENAI_MODEL,
                model_provider="openai",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
        elif settings.AI_PROVIDER == "azure":
            return init_chat_model(
                settings.AZURE_OPENAI_DEPLOYMENT,
                model_provider="azure_openai",
                api_key=settings.AZURE_OPENAI_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.3,
            )
        else:
            return init_chat_model(
                settings.OLLAMA_MODEL,
                model_provider="ollama",
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.3,
            )

    def _get_prompt(self, question_type: str, context: str, difficulty: str, num_questions: int) -> str:
        if question_type.lower() == "mcq":
            return TEACHER_MCQ_PROMPT_TEMPLATE.format(
                context=context, difficulty=difficulty, num_questions=num_questions
            )
        elif question_type.lower() == "fill_blanks":
            return TEACHER_FILL_BLANKS_PROMPT_TEMPLATE.format(
                context=context, difficulty=difficulty, num_questions=num_questions
            )
        elif question_type.lower() == "theory":
            return TEACHER_THEORY_PROMPT_TEMPLATE.format(
                context=context, difficulty=difficulty, num_questions=num_questions
            )
        else:
            return TEACHER_MIXED_PROMPT_TEMPLATE.format(
                context=context, num_questions=num_questions
            )

    async def generate_quiz(
        self,
        topic_name: str,
        question_type: str,
        difficulty: str,
        num_questions: int,
    ) -> dict:
        context = retrieve_context(topic_name, topic_name)
        if not context:
            return {"status": "error", "message": f"No content found for topic: {topic_name}"}

        prompt = self._get_prompt(
            question_type=question_type,
            context=context,
            difficulty=difficulty,
            num_questions=num_questions,
        )

        response = await self.llm.ainvoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if not json_match:
            logger.error(f"Failed to extract JSON from LLM response: {content[:200]}")
            return {"status": "error", "message": "Model did not return valid JSON"}

        try:
            questions = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return {"status": "error", "message": "Failed to parse quiz questions"}

        quiz = StudentQuiz(
            topic_name=topic_name,
            question_type=question_type,
            difficulty=difficulty,
            num_questions=num_questions,
        )
        self.db.add(quiz)
        await self.db.flush()
        await self.db.refresh(quiz)

        for q in questions:
            question = StudentQuizQuestion(
                quiz_id=quiz.id,
                question_type=question_type,
                question=q.get("question", ""),
                options=json.dumps(q.get("options", [])),
                answer=q.get("answer", ""),
            )
            self.db.add(question)

        await self.db.flush()

        return {
            "status": "success",
            "quiz_id": quiz.id,
            "questions": questions,
        }

    async def evaluate_quiz(
        self,
        quiz_id: int,
        student_name: str,
        answers: list,
    ) -> dict:
        correct = 0
        wrong = 0

        for item in answers:
            result = await self.db.execute(
                select(StudentQuizQuestion)
                .where(StudentQuizQuestion.id == item.question_id)
            )
            question = result.scalar_one_or_none()
            if not question:
                continue
            if item.selected_answer.strip().upper() == question.answer.strip().upper():
                correct += 1
            else:
                wrong += 1

        total = correct + wrong
        score = (correct / total * 100) if total > 0 else 0

        quiz_result = StudentQuizResult(
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
