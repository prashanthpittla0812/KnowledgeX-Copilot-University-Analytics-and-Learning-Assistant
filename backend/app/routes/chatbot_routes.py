from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.permissions import require_role
from app.database.models import User
from app.schemas.chatbot_schema import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(require_role("student", "faculty")),
):
    if not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty",
        )
    rag = RAGService()
    result = rag.generate_answer(question=request.question)
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )
