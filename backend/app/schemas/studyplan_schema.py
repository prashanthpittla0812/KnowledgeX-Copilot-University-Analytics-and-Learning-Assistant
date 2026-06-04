from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class StudyPlanRequest(BaseModel):
    subjects: list[str]
    exam_date: date
    daily_hours: float = 3.0


class DailyScheduleItem(BaseModel):
    day: int
    date: str
    subject: str
    topics: list[str]
    duration_hours: float
    activities: list[str]
    resources: list[str]


class StudyPlanContent(BaseModel):
    overview: str
    daily_schedule: list[DailyScheduleItem]
    tips: list[str]
    milestones: list[str]


class StudyPlanResponse(BaseModel):
    id: int
    user_id: int
    plan_content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StudyPlanHistoryItem(BaseModel):
    id: int
    plan_content: str
    created_at: datetime

    model_config = {"from_attributes": True}
