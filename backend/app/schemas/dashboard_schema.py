from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_students: int
    total_faculty: int
    total_documents: int
    total_quizzes: int


class PerformanceMetric(BaseModel):
    user_id: int
    user_name: str
    average_score: float
    quizzes_taken: int
    documents_uploaded: int


class PerformanceResponse(BaseModel):
    metrics: list[PerformanceMetric]


class LearningGapItem(BaseModel):
    topic: str
    average_score: float
    students_at_risk: list[str]
    recommended_action: str


class LearningGapsResponse(BaseModel):
    learning_gaps: list[LearningGapItem]
    overall_class_health: str
    faculty_recommendations: list[str]
