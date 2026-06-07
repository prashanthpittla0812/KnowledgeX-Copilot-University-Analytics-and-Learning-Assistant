from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_faculty, get_current_student
from app.database.db import get_db
from app.database.models import User
from app.schemas.assessment_schema import (
    ClassInsightsResponse,
    ClassPerformanceSummary,
    LearningGapResponse,
    QuizAttemptRequest,
    QuizAttemptResponse,
    StudentRecommendation,
    StudentResultsResponse,
)
from app.services.assessment_service import AssessmentService
from app.services.learning_gap_service import LearningGapService
from app.services.student_dashboard_service import StudentDashboardService

router = APIRouter(prefix="/assessment", tags=["Assessment"])


@router.post("/attempt", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def submit_quiz_attempt(
    request: QuizAttemptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    service = AssessmentService(db)
    try:
        result = await service.submit_attempt(
            quiz_id=request.quiz_id,
            student_id=current_user.id,
            answers=[a.model_dump() for a in request.answers],
        )
        return QuizAttemptResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/results", response_model=StudentResultsResponse)
async def get_student_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    service = StudentDashboardService(db)
    result = await service.get_results(current_user.id)
    return StudentResultsResponse(**result)


@router.get("/recommendations", response_model=StudentRecommendation)
async def get_student_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    service = StudentDashboardService(db)
    result = await service.get_recommendations(current_user.id)
    return StudentRecommendation(**result)


@router.get("/learning-gaps/{quiz_id}", response_model=LearningGapResponse)
async def get_quiz_learning_gaps(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = LearningGapService(db)
    result = await service.get_learning_gaps(quiz_id)
    return LearningGapResponse(**result)


@router.get("/class-insights/{quiz_id}", response_model=ClassInsightsResponse)
async def get_class_insights(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = LearningGapService(db)
    result = await service.get_class_insights(quiz_id, current_user.id)
    return ClassInsightsResponse(**result)


@router.get("/class-performance/{quiz_id}", response_model=ClassPerformanceSummary)
async def get_class_performance(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = LearningGapService(db)
    result = await service.get_class_performance(quiz_id)
    return ClassPerformanceSummary(**result)
