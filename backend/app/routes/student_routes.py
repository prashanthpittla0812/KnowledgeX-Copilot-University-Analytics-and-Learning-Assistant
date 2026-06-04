from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import get_db
from app.schemas.teacher_schema import (
    StudentQuizEvalRequest,
    StudentQuizEvalResponse,
    StudentQuizGenRequest,
    StudentQuizGenResponse,
    StudentQuizResponse,
    StudentQuizSubmission,
    StudentSubmitResponse,
)
from app.services.student_quiz_gen_service import StudentQuizGenService
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
            status_code=404,
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


@router.post("/quiz/generate", response_model=StudentQuizGenResponse)
async def generate_quiz(
    request: StudentQuizGenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizGenService(db)
    result = await service.generate_quiz(
        topic_name=request.topic_name,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
    )
    if result.get("status") == "error":
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Quiz generation failed"),
        )
    return StudentQuizGenResponse(**result)


@router.post("/quiz/evaluate", response_model=StudentQuizEvalResponse)
async def evaluate_quiz(
    request: StudentQuizEvalRequest,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizGenService(db)
    result = await service.evaluate_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers,
    )
    return StudentQuizEvalResponse(**result)
