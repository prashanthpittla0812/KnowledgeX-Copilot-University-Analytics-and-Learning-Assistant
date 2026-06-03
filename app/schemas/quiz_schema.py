from pydantic import BaseModel
from typing import Optional


class QuizRequest(BaseModel):
    topic_name: str
    question_type: str
    difficulty: str
    num_questions: int


class QuizResponse(BaseModel):
    quiz_id: Optional[int]
    topic_name: str
    question_type: str
    difficulty: str
    questions: list