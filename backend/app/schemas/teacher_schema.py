from pydantic import BaseModel
from typing import List, Optional


class QuizGenerateRequest(BaseModel):
    faculty_name: str
    topic_name: str
    document_topic: Optional[str] = None
    question_type: str
    difficulty: str
    num_questions: int
    is_assessment: Optional[bool] = False
    manual_questions: Optional[str] = None
    duration_mins: Optional[int] = 60


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


from typing import List, Optional

class StudentQuizResponse(BaseModel):
    quiz_id: int
    topic_name: Optional[str] = None
    question_type: Optional[str] = None
    num_questions: Optional[int] = None
    created_at: Optional[str] = None
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
    average_score: float = 0.0
    highest_score: float = 0.0
    lowest_score: float = 0.0
    total_attempts: int = 0


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


class StudentQuizGenRequest(BaseModel):
    topic_name: str
    question_type: str
    difficulty: str
    num_questions: int


class StudentQuizGenResponse(BaseModel):
    status: str
    quiz_id: Optional[int] = None
    questions: Optional[List[dict]] = None
    message: Optional[str] = None


class AnswerItem(BaseModel):
    question_id: int
    selected_answer: str


class StudentQuizEvalRequest(BaseModel):
    quiz_id: int
    student_name: str
    answers: List[AnswerItem]


class StudentQuizEvalResponse(BaseModel):
    quiz_id: int
    student_name: str
    correct_answers: int
    wrong_answers: int
    score_percentage: float
