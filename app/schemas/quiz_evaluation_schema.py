from pydantic import BaseModel
from typing import List


class AnswerItem(BaseModel):
    question_id: int
    selected_answer: str


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    student_name: str
    answers: List[AnswerItem]