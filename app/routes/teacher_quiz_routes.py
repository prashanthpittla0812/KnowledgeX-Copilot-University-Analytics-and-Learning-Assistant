from fastapi import APIRouter

from app.schemas.teacher_quiz_schema import (
    TeacherQuizRequest
)

from app.services.teacher_quiz_service import (
    teacher_quiz_service
)

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher Quiz"]
)


@router.post("/generate-quiz")
def generate_quiz(
    request: TeacherQuizRequest
):

    return teacher_quiz_service.generate_quiz(
        teacher_name=request.teacher_name,
        topic_name=request.topic_name,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    )