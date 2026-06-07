from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_faculty
from app.database.db import get_db
from app.database.models import User
from app.schemas.dashboard_schema import (
    DashboardStats,
    LearningGapsResponse,
    PerformanceResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.teacher_dashboard_service import TeacherDashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    return await analytics.get_dashboard_stats()


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    metrics = await analytics.get_performance_metrics()
    return PerformanceResponse(metrics=metrics)


@router.get("/learning-gaps", response_model=LearningGapsResponse)
async def get_learning_gaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    return await analytics.get_learning_gaps()


@router.get("/teacher/performance")
async def get_teacher_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = TeacherDashboardService(db)
    return await service.get_all_quiz_performance(current_user.id)


@router.get("/teacher/quizzes")
async def get_teacher_quizzes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = TeacherDashboardService(db)
    return {"quizzes": await service.get_teacher_quizzes(current_user.id)}


@router.get("/teacher/documents")
async def get_teacher_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = TeacherDashboardService(db)
    return {"documents": await service.get_teacher_documents(current_user.id)}
