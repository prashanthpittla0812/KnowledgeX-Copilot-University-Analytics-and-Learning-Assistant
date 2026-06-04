from pydantic import BaseModel
from typing import List


class StudentAnswer(BaseModel):
    question_id: int
    answer: str


class StudentQuizSubmission(BaseModel):
    quiz_id: int
    student_name: str
    answers: List[StudentAnswer]