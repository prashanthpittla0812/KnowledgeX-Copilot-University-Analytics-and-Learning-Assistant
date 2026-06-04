from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import get_db
from app.schemas.teacher_schema import (
    StudentQuizResponse,
    StudentQuizSubmission,
    StudentSubmitResponse,
)
from app.services.student_service import StudentQuizService, StudentSubmitService

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/quiz/{quiz_id}", response_model=StudentQuizResponse)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizService(db)
    result = await service.get_quiz(quiz_id)
    if not result["questions"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    return StudentQuizResponse(**result)


@router.post("/submit", response_model=StudentSubmitResponse)
async def submit_quiz(
    request: StudentQuizSubmission,
    db: AsyncSession = Depends(get_db),
):
    service = StudentSubmitService(db)
    result = await service.submit_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers,
    )
    return StudentSubmitResponse(**result)
