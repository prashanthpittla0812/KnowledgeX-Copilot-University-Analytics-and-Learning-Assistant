from pydantic import BaseModel


class TeacherQuizRequest(BaseModel):

    topic_name: str

    question_type: str

    difficulty: str

    num_questions: int

    teacher_name: str