from fastapi import APIRouter

from app.schemas.quiz_schema import QuizRequest

from app.services.quiz_service import (
    quiz_service
)

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"]
)


@router.post("/generate")
def generate_quiz(
        request: QuizRequest
):

    return quiz_service.generate_quiz(
        topic_name=request.topic_name,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    )