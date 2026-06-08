from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth.permissions import require_role
from app.database.db import get_db
from app.database.models import User, ProcessedContent, LearningMaterial
from app.schemas.chatbot_schema import ChatRequest, ChatResponse, SummaryRequest, SummaryBatchRequest, SummaryResponse
from app.services.rag_service import RAGService
from app.services.security_service import SecurityService

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    if not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty",
        )
        
    # 1. Security Check on User Input
    is_violation, reason = SecurityService.evaluate_prompt(request.question)
    if is_violation:
        await SecurityService.log_security_event(db, current_user.id, reason, "Policy Violation", request.question)
        return ChatResponse(
            answer="I am programmed to be a helpful and harmless academic assistant. My safety guidelines strictly prohibit me from answering this request or engaging with this content. Please revise your query to align with educational and academic topics.",
            sources=[]
        )

    # 2. Role-based Document Access Filter
    allowed_content_ids = request.content_ids
    if request.content_ids and current_user.role == "student":
        # Students can query their own uploads, or materials linked to them
        query = select(ProcessedContent.id).where(
            ProcessedContent.id.in_(request.content_ids),
            ProcessedContent.uploaded_by == current_user.id
        )
        res = await db.execute(query)
        allowed_content_ids = res.scalars().all()
        # Note: If no allowed content is found, we can still let them query general knowledge
        # Or we fallback to letting the LLM answer without context.

    rag = RAGService()
    result = rag.generate_answer(question=request.question, content_ids=allowed_content_ids)
    
    # 3. Output Moderation
    is_violation, reason = SecurityService.evaluate_prompt(result["answer"])
    if is_violation:
        await SecurityService.log_security_event(db, current_user.id, reason, "Output Moderation Triggered", result["answer"][:200])
        return ChatResponse(
            answer="I apologize, but my safety guidelines prevent me from generating a response to this query.",
            sources=[]
        )
        
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

