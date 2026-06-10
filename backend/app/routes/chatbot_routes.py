from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import tempfile
import json

from app.auth.permissions import require_role
from app.database.db import get_db
from app.database.models import User, ProcessedContent, LearningMaterial
from app.schemas.chatbot_schema import ChatRequest, ChatResponse, SummaryRequest, SummaryBatchRequest, SummaryResponse
from app.services.rag_service import RAGService
from app.services.security_service import SecurityService
from app.services.audio_processor import AudioProcessor

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

    # 2. Document Access Filter
    # We allow the student to query the content IDs explicitly requested by the frontend,
    # as the frontend has already filtered the accessible learning materials.
    allowed_content_ids = request.content_ids
    if request.content_ids:
        # Verify the contents actually exist in the DB
        query = select(ProcessedContent.id).where(ProcessedContent.id.in_(request.content_ids))
        res = await db.execute(query)
        allowed_content_ids = res.scalars().all()

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

@router.post("/audio", response_model=ChatResponse)
async def chat_audio(
    file: UploadFile = File(...),
    content_ids: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    """
    Process an audio question from the user, transcribe it via ASR,
    and then process it through the RAG chat pipeline.
    """
    # 1. Save uploaded audio temporarily
    temp_fd, temp_path = tempfile.mkstemp(suffix=f"_{file.filename}")
    try:
        with os.fdopen(temp_fd, "wb") as f:
            f.write(await file.read())
            
        # 2. Transcribe Audio
        audio_processor = AudioProcessor()
        transcript = audio_processor.transcribe_audio(temp_path)
        
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not transcribe audio or audio was empty.",
            )
            
        # 3. Security Check on Transcript
        is_violation, reason = SecurityService.evaluate_prompt(transcript)
        if is_violation:
            await SecurityService.log_security_event(db, current_user.id, reason, "Policy Violation", transcript)
            return ChatResponse(
                answer="I am programmed to be a helpful and harmless academic assistant. My safety guidelines strictly prohibit me from answering this request or engaging with this content.",
                sources=[]
            )

        # 4. Parse content_ids
        allowed_content_ids = []
        if content_ids.strip():
            try:
                if content_ids.startswith("["):
                    allowed_content_ids = json.loads(content_ids)
                else:
                    allowed_content_ids = [int(cid.strip()) for cid in content_ids.split(",") if cid.strip()]
            except ValueError:
                pass
                
        if allowed_content_ids:
            query = select(ProcessedContent.id).where(ProcessedContent.id.in_(allowed_content_ids))
            res = await db.execute(query)
            allowed_content_ids = res.scalars().all()

        # 5. Generate Answer
        rag = RAGService()
        result = rag.generate_answer(question=transcript, content_ids=allowed_content_ids)
        
        # 6. Output Moderation
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
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
