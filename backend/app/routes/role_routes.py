from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_admin, get_current_faculty, get_current_student
from app.database.db import get_db
from app.database.models import Document, Quiz, User
from app.schemas.user_schema import UserDetailResponse, UserListResponse
from app.services.analytics_service import AnalyticsService
from app.utils.constants import DEFAULT_PAGE, DEFAULT_PAGE_SIZE

student_router = APIRouter(prefix="/student", tags=["Student"])
faculty_router = APIRouter(prefix="/faculty", tags=["Faculty"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@student_router.get("/dashboard")
async def student_dashboard(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    doc_count = await db.scalar(
        select(func.count()).select_from(Document).where(Document.user_id == current_user.id)
    )
    quiz_count = await db.scalar(
        select(func.count()).select_from(Quiz).where(Quiz.user_id == current_user.id)
    )
    quiz_scores = await db.execute(
        select(Quiz.score).where(Quiz.user_id == current_user.id, Quiz.score.isnot(None))
    )
    scores = [row[0] for row in quiz_scores.all()]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "documents_uploaded": doc_count or 0,
        "quizzes_taken": quiz_count or 0,
        "average_quiz_score": avg_score,
    }


@faculty_router.get("/dashboard")
async def faculty_dashboard(
    current_user: User = Depends(get_current_faculty),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    stats = await analytics.get_dashboard_stats()
    metrics = await analytics.get_performance_metrics()
    return {
        "name": current_user.name,
        "email": current_user.email,
        "stats": stats,
        "performance_metrics": metrics,
    }


@admin_router.get("/dashboard")
async def admin_dashboard(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    stats = await analytics.get_dashboard_stats()
    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "stats": stats,
    }


@admin_router.get("/users", response_model=UserListResponse)
async def admin_list_users(
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    skip = (page - 1) * page_size
    query = select(User).offset(skip).limit(page_size).order_by(User.created_at.desc())
    count_query = select(func.count()).select_from(User)
    result = await db.execute(query)
    total = await db.scalar(count_query)
    users = result.scalars().all()
    return UserListResponse(
        users=[UserDetailResponse.model_validate(u) for u in users],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@admin_router.get("/users/{user_id}", response_model=UserDetailResponse)
async def admin_get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@admin_router.patch(
    "/users/{user_id}/activate",
    response_model=UserDetailResponse,
    summary="Activate a user account",
)
async def admin_activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User account is already active",
        )
    user.is_active = True
    await db.flush()
    await db.refresh(user)
    return user


@admin_router.patch(
    "/users/{user_id}/deactivate",
    response_model=UserDetailResponse,
    summary="Deactivate a user account",
)
async def admin_deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User account is already inactive",
        )
    user.is_active = False
    await db.flush()
    await db.refresh(user)
    return user


@admin_router.get("/system-stats")
async def admin_system_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    return await analytics.get_dashboard_stats()
