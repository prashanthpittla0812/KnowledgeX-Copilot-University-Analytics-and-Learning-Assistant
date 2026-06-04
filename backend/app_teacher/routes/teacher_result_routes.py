from fastapi import APIRouter

from app.services.teacher_result_service import (
    teacher_result_service
)

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher Results"]
)


@router.get("/results/{quiz_id}")
def get_results(
    quiz_id: int
):

    return teacher_result_service.get_results(
        quiz_id
    )