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


class StudentPerformance(BaseModel):
    student_name: str
    profile_photo_path: str | None = None
    department: str | None = None
    designation: str | None = None
    average_score: float

class TopicAccuracy(BaseModel):
    topic: str
    average_accuracy: float

class LearningGapsResponse(BaseModel):
    student_performance: list[StudentPerformance]
    weak_topics: list[TopicAccuracy]
    strong_topics: list[TopicAccuracy]
    overall_class_health: str
    faculty_recommendations: list[str]
