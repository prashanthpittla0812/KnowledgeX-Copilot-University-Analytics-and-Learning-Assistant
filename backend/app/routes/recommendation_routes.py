from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_student
from app.database.db import get_db
from app.database.models import User
from app.schemas.recommendation_schema import RecommendationHistoryItem, RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/{student_id}", response_model=RecommendationResponse)
async def get_recommendations(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    rec_service = RecommendationService(db)
    try:
        result = await rec_service.generate_recommendations(student_id=student_id)
        return RecommendationResponse(
            weak_topics=result.get("weak_topics", []),
            recommended_materials=result.get("recommended_materials", []),
            suggested_quizzes=result.get("suggested_quizzes", []),
            overall_advice=result.get("overall_advice", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{student_id}/history", response_model=list[RecommendationHistoryItem])
async def get_recommendation_history(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    rec_service = RecommendationService(db)
    recs = await rec_service.get_recommendations(student_id=student_id)
    return [
        RecommendationHistoryItem(
            id=r.id,
            recommendation_text=r.recommendation_text,
            created_at=r.created_at,
        )
        for r in recs
    ]
