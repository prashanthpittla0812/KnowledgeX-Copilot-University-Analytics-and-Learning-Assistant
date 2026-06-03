from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    number_of_questions: int = 10


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    explanation: str


class QuizGenerateResponse(BaseModel):
    quiz: list[QuizQuestion]
    topic: str
    difficulty: str


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    answers: list[str]


class QuizResultResponse(BaseModel):
    quiz_id: int
    score: float
    total_questions: int
    correct_answers: int
    topic: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizHistoryItem(BaseModel):
    id: int
    topic: str
    score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}
