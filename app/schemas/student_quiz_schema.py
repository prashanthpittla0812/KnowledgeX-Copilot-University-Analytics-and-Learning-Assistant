from pydantic import BaseModel


class StudentQuizResponse(BaseModel):
    quiz_id: int