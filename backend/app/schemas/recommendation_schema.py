from datetime import datetime

from pydantic import BaseModel


class RecommendedMaterial(BaseModel):
    topic: str
    resource: str
    reason: str
    url: str | None = None


class SuggestedQuiz(BaseModel):
    topic: str
    difficulty: str
    reason: str


class RecommendationResponse(BaseModel):
    weak_topics: list[str]
    recommended_materials: list[RecommendedMaterial]
    suggested_quizzes: list[SuggestedQuiz]
    overall_advice: str = ""


class RecommendationHistoryItem(BaseModel):
    id: int
    recommendation_text: str
    created_at: datetime

    model_config = {"from_attributes": True}
