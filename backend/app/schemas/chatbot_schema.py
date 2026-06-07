from pydantic import BaseModel
from typing import List, Dict, Any

class ChatRequest(BaseModel):
    question: str
    content_ids: List[int] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []

class SummaryRequest(BaseModel):
    content_id: int
    summary_type: str = "Short Summary"

class SummaryBatchRequest(BaseModel):
    content_ids: List[int]
    summary_type: str = "Short Summary"

class SummaryResponse(BaseModel):
    summary: str

