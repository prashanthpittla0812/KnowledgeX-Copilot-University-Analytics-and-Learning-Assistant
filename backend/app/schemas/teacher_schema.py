from pydantic import BaseModel
from typing import List, Optional


class QuizGenerateRequest(BaseModel):
    faculty_name: str
    topic_name: str
    question_type: str
    difficulty: str
    num_questions: int


class QuizGenerateResponse(BaseModel):
    status: str
    quiz_id: Optional[int] = None
    questions: Optional[List[dict]] = None
    message: Optional[str] = None


class StudentAnswer(BaseModel):
    question_id: int
    answer: str


class StudentQuizSubmission(BaseModel):
    quiz_id: int
    student_name: str
    answers: List[StudentAnswer]


class StudentQuizResponse(BaseModel):
    quiz_id: int
    questions: List[dict]


class ResultItem(BaseModel):
    student_name: str
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score_percentage: float
    submitted_at: str


class ResultResponse(BaseModel):
    quiz_id: int
    results: List[ResultItem]


class UploadResponse(BaseModel):
    status: str
    message: str


class HomeResponse(BaseModel):
    message: str


class StudentSubmitResponse(BaseModel):
    quiz_id: int
    student_name: str
    correct_answers: int
    wrong_answers: int
    score_percentage: float
