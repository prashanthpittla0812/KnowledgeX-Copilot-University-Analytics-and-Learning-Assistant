from fastapi import APIRouter

from app.schemas.student_submit_schema import (
    StudentQuizSubmission
)

from app.services.student_submit_service import (
    student_submit_service
)

router = APIRouter(
    prefix="/student",
    tags=["Student Submit"]
)


@router.post("/submit")
def submit_quiz(
    request: StudentQuizSubmission
):

    return student_submit_service.submit_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers
    )