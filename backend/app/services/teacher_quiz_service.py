import json
import re

from langchain.chat_models import init_chat_model
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.prompts import (
    TEACHER_FILL_BLANKS_PROMPT_TEMPLATE,
    TEACHER_MCQ_PROMPT_TEMPLATE,
    TEACHER_MIXED_PROMPT_TEMPLATE,
    TEACHER_THEORY_PROMPT_TEMPLATE,
)
from app.config.settings import settings
from app.database.models import TeacherQuiz, TeacherQuizQuestion
from app.services.teacher_chroma_service import retrieve_context
from app.utils.logger import get_logger

logger = get_logger()


class TeacherQuizService:
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
        elif settings.AI_PROVIDER == "groq":
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
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
        faculty_name: str,
        topic_name: str,
        question_type: str,
        difficulty: str,
        num_questions: int,
        teacher_id: int = None,
    ) -> dict:
        context = retrieve_context(topic_name, topic_name)
        if not context:
            return {"status": "error", "message": "No content found for this topic. Upload a document first."}

        prompt = self._get_prompt(
            question_type=question_type,
            context=context,
            difficulty=difficulty,
            num_questions=num_questions,
        )

        response = await self.llm.ainvoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        questions = None
        try:
            questions = json.loads(content)
        except json.JSONDecodeError:
            pass

        if questions is None:
            json_match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
            if json_match:
                try:
                    questions = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass

        if questions is None:
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1 and end > start:
                try:
                    questions = json.loads(content[start:end+1])
                except json.JSONDecodeError:
                    pass

        if questions is None or not isinstance(questions, list):
            logger.error(f"Failed to extract JSON from LLM response: {content[:200]}")
            return {"status": "error", "message": "Failed to generate valid quiz format"}

        quiz = TeacherQuiz(
            teacher_name=faculty_name,
            teacher_id=teacher_id,
            topic_name=topic_name,
            question_type=question_type,
            difficulty=difficulty,
            num_questions=num_questions,
        )
        self.db.add(quiz)
        await self.db.flush()
        await self.db.refresh(quiz)

        for q in questions:
            question = TeacherQuizQuestion(
                quiz_id=quiz.id,
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



