import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_student
from app.database.db import get_db
from app.database.models import User
from app.schemas.studyplan_schema import (
    StudyPlanHistoryItem,
    StudyPlanRequest,
    StudyPlanResponse,
)
from app.services.studyplan_service import StudyPlanService

router = APIRouter(prefix="/studyplan", tags=["Study Plan"])


@router.post("/generate", response_model=StudyPlanResponse)
async def generate_study_plan(
    request: StudyPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    studyplan_service = StudyPlanService(db)
    try:
        result = await studyplan_service.generate_plan(
            user=current_user,
            subjects=request.subjects,
            exam_date=str(request.exam_date),
            daily_hours=request.daily_hours,
        )
        return StudyPlanResponse(
            id=result["id"],
            user_id=current_user.id,
            plan_content=json.dumps(result["plan"]),
            created_at=result["created_at"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/history", response_model=list[StudyPlanHistoryItem])
async def get_study_plan_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    studyplan_service = StudyPlanService(db)
    plans = await studyplan_service.get_user_plans(user=current_user)
    return [
        StudyPlanHistoryItem(
            id=p.id,
            plan_content=p.plan_content,
            created_at=p.created_at,
        )
        for p in plans
    ]
