from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_student
from app.database.db import get_db
from app.database.models import User
from app.schemas.quiz_schema import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizHistoryItem,
    QuizResultResponse,
    QuizSubmitRequest,
)
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    quiz_service = QuizService(db)
    try:
        result = await quiz_service.generate_quiz(
            user=current_user,
            topic=request.topic,
            difficulty=request.difficulty,
            number_of_questions=request.number_of_questions,
        )
        return QuizGenerateResponse(
            quiz_id=result["quiz_id"],
            quiz=result["quiz"],
            topic=result["topic"],
            difficulty=result["difficulty"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    quiz_service = QuizService(db)
    try:
        result = await quiz_service.submit_quiz_result(
            quiz_id=request.quiz_id,
            user=current_user,
            answers=request.answers,
        )
        return QuizResultResponse(
            quiz_id=result["quiz_id"],
            score=result["score"],
            total_questions=result["total_questions"],
            correct_answers=result["correct_answers"],
            topic=result["topic"],
            created_at=current_user.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/history", response_model=list[QuizHistoryItem])
async def get_quiz_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    quiz_service = QuizService(db)
    quizzes = await quiz_service.get_quiz_history(user=current_user)
    return [
        QuizHistoryItem(
            id=q.id,
            topic=q.topic,
            score=q.score,
            created_at=q.created_at,
        )
        for q in quizzes
    ]
