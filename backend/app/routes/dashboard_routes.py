from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database.db import get_db
from app.database.models import User
from app.schemas.dashboard_schema import (
    DashboardStats,
    LearningGapsResponse,
    PerformanceResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("faculty", "admin")),
):
    analytics = AnalyticsService(db)
    return await analytics.get_dashboard_stats()


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("faculty", "admin")),
):
    analytics = AnalyticsService(db)
    metrics = await analytics.get_performance_metrics()
    return PerformanceResponse(metrics=metrics)


@router.get("/learning-gaps", response_model=LearningGapsResponse)
async def get_learning_gaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("faculty", "admin")),
):
    analytics = AnalyticsService(db)
    return await analytics.get_learning_gaps()
