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
                max_tokens=4096,
            )
        elif settings.AI_PROVIDER == "azure":
            return init_chat_model(
                settings.AZURE_OPENAI_DEPLOYMENT,
                model_provider="azure_openai",
                api_key=settings.AZURE_OPENAI_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.3,
                max_tokens=4096,
            )
        elif settings.AI_PROVIDER == "groq":
            logger.info("Using Groq LLM")
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                max_tokens=4096,
            )
        else:
            logger.info("Using Groq LLM as default fallback")
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                max_tokens=4096,
            )

    def _get_prompt(self, question_type: str, context: str, difficulty: str, num_questions: int) -> str:
        q_type = question_type.lower()
        if "mcq" in q_type:
            return TEACHER_MCQ_PROMPT_TEMPLATE.format(
                context=context, difficulty=difficulty, num_questions=num_questions
            )
        elif "fill" in q_type or "blank" in q_type:
            return TEACHER_FILL_BLANKS_PROMPT_TEMPLATE.format(
                context=context, difficulty=difficulty, num_questions=num_questions
            )
        elif "theory" in q_type or "word" in q_type:
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
        document_topic: str = None,
        teacher_id: int = None,
        is_assessment: bool = False,
        manual_questions: str = None,
        duration_mins: int = 60,
        semester: str = None,
        max_violations: int = 3,
    ) -> dict:
        if manual_questions:
            # Check if manual_questions is already a valid JSON string (from the new ManualQuestionBuilder UI)
            is_valid_json = False
            try:
                parsed_manual = json.loads(manual_questions)
                if isinstance(parsed_manual, list):
                    is_valid_json = True
                    content = manual_questions
            except json.JSONDecodeError:
                pass

            if not is_valid_json:
                # Fallback for old textarea inputs
                prompt = f"Format the following manual questions into a JSON list of objects with 'question', 'options' (empty list if none), and 'answer' (empty string if none) keys.\n\nQuestions:\n{manual_questions}\n\nReturn ONLY valid JSON."
                response = await self.llm.ainvoke(prompt)
                content = response.content if hasattr(response, "content") else str(response)
        else:
            doc_topic = document_topic or topic_name
            context = retrieve_context(doc_topic, topic_name)
            if not context:
                return {"status": "error", "message": "No content found for this topic. Upload a document first."}

            if is_assessment:
                prompt = f"Generate {num_questions} questions for an assessment of type {question_type} at {difficulty} difficulty.\nUse ONLY this context:\n{context}\n\nReturn ONLY valid JSON as a list of objects with 'question', 'options' (empty list if none), and 'answer' (empty string if none) keys."
            else:
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

        if questions is None:
            start = content.find('[')
            if start != -1:
                last_brace = content.rfind('}')
                if last_brace != -1 and last_brace > start:
                    fixed_content = content[start:last_brace+1] + "\n]"
                    try:
                        questions = json.loads(fixed_content)
                    except json.JSONDecodeError:
                        pass

        if isinstance(questions, dict):
            if "questions" in questions:
                questions = questions["questions"]
            else:
                found_list = False
                for v in questions.values():
                    if isinstance(v, list):
                        questions = v
                        found_list = True
                        break
                if not found_list:
                    extracted_questions = []
                    for v in questions.values():
                        if isinstance(v, dict) and "question" in v:
                            extracted_questions.append(v)
                    if extracted_questions:
                        questions = extracted_questions

        if questions is None or not isinstance(questions, list):
            logger.error(f"Failed to extract JSON from LLM response: {content[:200]}")
            return {"status": "error", "message": "Failed to generate valid quiz format"}
        final_question_type = f"Assessment: {question_type} ({duration_mins} mins)" if is_assessment else question_type

        quiz = TeacherQuiz(
            teacher_name=faculty_name,
            teacher_id=teacher_id,
            topic_name=topic_name,
            question_type=final_question_type,
            difficulty=difficulty,
            num_questions=num_questions if not manual_questions else len(questions),
            semester=semester,
            duration_minutes=duration_mins,
            max_violations=max_violations,
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

    async def get_quiz(self, quiz_id: int) -> dict:
        from sqlalchemy import select
        result = await self.db.execute(
            select(TeacherQuizQuestion).where(TeacherQuizQuestion.quiz_id == quiz_id)
        )
        questions = result.scalars().all()
        
        formatted = []
        for q in questions:
            options = q.options
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except (json.JSONDecodeError, TypeError):
                    options = []
            formatted.append({
                "id": q.id,
                "question": q.question,
                "options": options,
                "answer": q.answer,
            })
            
        return {"quiz_id": quiz_id, "questions": formatted}



