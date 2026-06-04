from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QuizAnswerInput(BaseModel):
    question_id: int
    selected_answer: str


class QuizAttemptRequest(BaseModel):
    quiz_id: int
    answers: list[QuizAnswerInput]


class TopicScore(BaseModel):
    topic: str
    subtopic: Optional[str] = None
    correct: int
    total: int
    accuracy: float


class QuizAttemptResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    score: float
    percentage: float
    total_questions: int
    correct_answers: int
    wrong_answers: int
    topic_performances: list[TopicScore] = []
    submitted_at: datetime


class StudentResultItem(BaseModel):
    quiz_id: int
    topic: str
    difficulty: str
    score: float
    percentage: float
    total_questions: int
    correct_answers: int
    wrong_answers: int
    submitted_at: datetime


class StudentResultsResponse(BaseModel):
    results: list[StudentResultItem]
    topic_summaries: list[TopicScore]


class WeakTopic(BaseModel):
    topic: str
    accuracy: float
    total_questions: int


class StrongTopic(BaseModel):
    topic: str
    accuracy: float
    total_questions: int


class StudentRecommendation(BaseModel):
    weak_topics: list[WeakTopic]
    strong_topics: list[StrongTopic]
    recommended_revision_topics: list[str]
    recommended_quizzes: list[str]


class ClassPerformanceSummary(BaseModel):
    average_score: float
    highest_score: float
    lowest_score: float
    total_students: int
    total_attempts: int


class LearningGapItem(BaseModel):
    topic: str
    struggling_percentage: float
    total_students: int
    struggling_count: int


class LearningGapResponse(BaseModel):
    gaps: list[LearningGapItem]


class ClassInsightItem(BaseModel):
    topic: str
    class_accuracy: float
    status: str


class ClassInsightsResponse(BaseModel):
    strong_topics: list[ClassInsightItem]
    weak_topics: list[ClassInsightItem]
    recommended_revision_topics: list[str]
    ai_recommendations: Optional[str] = None


class FacultyDocumentResponse(BaseModel):
    id: int
    file_name: str
    topic: str
    chunks_count: int
    uploaded_at: datetime


class AdminSystemStats(BaseModel):
    total_students: int
    total_faculty: int
    total_quizzes_generated: int
    total_quizzes_attempted: int
    average_performance: float
