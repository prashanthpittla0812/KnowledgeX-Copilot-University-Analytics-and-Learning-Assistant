from fastapi import APIRouter

from app.schemas.quiz_evaluation_schema import (
    QuizSubmitRequest
)

from app.services.quiz_evaluation_service import (
    quiz_evaluation_service
)

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz Evaluation"]
)


@router.post("/submit")
def submit_quiz(
    request: QuizSubmitRequest
):

    return quiz_evaluation_service.evaluate_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers
    )