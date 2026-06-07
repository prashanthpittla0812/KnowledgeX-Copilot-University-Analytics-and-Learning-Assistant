from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth.permissions import require_role
from app.database.db import get_db
from app.database.models import User, ProcessedContent
from app.schemas.chatbot_schema import ChatRequest, ChatResponse, SummaryRequest, SummaryBatchRequest, SummaryResponse
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
    result = rag.generate_answer(question=request.question, content_ids=request.content_ids)
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )

@router.post("/summarize", response_model=SummaryResponse)
async def summarize(
    request: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    query = select(ProcessedContent).where(ProcessedContent.id == request.content_id)
    res = await db.execute(query)
    content = res.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    rag = RAGService()
    text_to_summarize = ""
    if content.transcript:
        text_to_summarize += content.transcript + "\n\n"
    if content.ocr_text:
        text_to_summarize += content.ocr_text
        
    summary = rag.summarize_content(text_to_summarize, request.summary_type)
    return SummaryResponse(summary=summary)

@router.post("/summarize-batch", response_model=SummaryResponse)
async def summarize_batch(
    request: SummaryBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    query = select(ProcessedContent).where(ProcessedContent.id.in_(request.content_ids))
    res = await db.execute(query)
    contents = res.scalars().all()
    
    if not contents:
        raise HTTPException(status_code=404, detail="Contents not found")
        
    rag = RAGService()
    text_to_summarize = ""
    for content in contents:
        text_to_summarize += f"--- {content.title} ---\n"
        if content.transcript:
            text_to_summarize += content.transcript + "\n\n"
        if content.ocr_text:
            text_to_summarize += content.ocr_text + "\n\n"
        
    summary = rag.summarize_content(text_to_summarize, request.summary_type)
    return SummaryResponse(summary=summary)

