from fastapi import APIRouter

from app.services.student_quiz_service import (
    student_quiz_service
)

router = APIRouter(
    prefix="/student",
    tags=["Student Quiz"]
)


@router.get("/quiz/{quiz_id}")
def get_quiz(
    quiz_id: int
):

    return student_quiz_service.get_quiz(
        quiz_id
    )