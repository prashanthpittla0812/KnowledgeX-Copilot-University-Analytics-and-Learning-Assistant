from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_faculty
from app.database.db import get_db
from app.database.models import User, Notification
from pydantic import BaseModel
from app.schemas.dashboard_schema import (
    DashboardStats,
    LearningGapsResponse,
    PerformanceResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.teacher_dashboard_service import TeacherDashboardService
from app.utils.cache import simple_cache

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

class RecommendationRequest(BaseModel):
    message: str

@router.post("/teacher/student/{student_id}/recommendation")
async def send_student_recommendation(
    student_id: int,
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    notif = Notification(
        user_id=student_id,
        title=f"Personal Recommendation from {current_user.name}",
        message=request.message,
        link="Recommendations",
    )
    db.add(notif)
    await db.commit()
    return {"message": "Recommendation sent successfully"}


@router.get("/stats", response_model=DashboardStats)
@simple_cache(ttl_seconds=300, key_prefix="dash_stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    return await analytics.get_dashboard_stats()


@router.get("/performance", response_model=PerformanceResponse)
@simple_cache(ttl_seconds=300, key_prefix="dash_perf")
async def get_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    metrics = await analytics.get_performance_metrics()
    return PerformanceResponse(metrics=metrics)


@router.get("/learning-gaps", response_model=LearningGapsResponse)
@simple_cache(ttl_seconds=300, key_prefix="dash_gaps")
async def get_learning_gaps(
    quiz_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    analytics = AnalyticsService(db)
    return await analytics.get_learning_gaps(quiz_id)


@router.get("/teacher/performance")
@simple_cache(ttl_seconds=300, key_prefix="teach_perf")
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


@router.get("/teacher/recent-quiz-rankings")
@simple_cache(ttl_seconds=300, key_prefix="teach_ranks")
async def get_recent_quiz_rankings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    service = TeacherDashboardService(db)
    return await service.get_recent_quiz_rankings(current_user.id)
