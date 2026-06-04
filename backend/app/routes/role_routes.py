import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from langchain_core.documents import Document as LangchainDocument
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import get_current_admin, get_current_faculty, get_current_student
from app.config.settings import settings
from app.database.db import get_db
from app.database.models import Document, Quiz, User
from app.schemas.teacher_schema import (
    HomeResponse,
    QuizGenerateRequest,
    QuizGenerateResponse,
    ResultResponse,
    UploadResponse,
)
from app.schemas.user_schema import UserDetailResponse, UserListResponse
from app.services.analytics_service import AnalyticsService
from app.services.teacher_chroma_service import save_to_chroma
from app.services.teacher_quiz_service import TeacherQuizService
from app.services.teacher_result_service import TeacherResultService
from app.utils.chunking import split_text
from app.utils.constants import DEFAULT_PAGE, DEFAULT_PAGE_SIZE
from app.utils.logger import get_logger
from app.utils.pdf_loader import extract_text_from_pdf

logger = get_logger()

student_router = APIRouter(prefix="/student", tags=["Student"])
faculty_router = APIRouter(prefix="/faculty", tags=["Faculty"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@student_router.get("/dashboard")
async def student_dashboard(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    doc_count = await db.scalar(
        select(func.count()).select_from(Document).where(Document.user_id == current_user.id)
    )
    quiz_count = await db.scalar(
        select(func.count()).select_from(Quiz).where(Quiz.user_id == current_user.id)
    )
    quiz_scores = await db.execute(
        select(Quiz.score).where(Quiz.user_id == current_user.id, Quiz.score.isnot(None))
    )
    scores = [row[0] for row in quiz_scores.all()]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "documents_uploaded": doc_count or 0,
        "quizzes_taken": quiz_count or 0,
        "average_quiz_score": avg_score,
    }


@faculty_router.get("/dashboard")
async def faculty_dashboard(
    current_user: User = Depends(get_current_faculty),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    stats = await analytics.get_dashboard_stats()
    metrics = await analytics.get_performance_metrics()
    return {
        "name": current_user.name,
        "email": current_user.email,
        "stats": stats,
        "performance_metrics": metrics,
    }


@faculty_router.get("/", response_model=HomeResponse)
async def faculty_home():
    return {"message": "Faculty Module Running"}


@faculty_router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def faculty_upload_document(
    topic_name: str,
    file: UploadFile = File(...),
):
    upload_dir = str(settings.UPLOAD_PATH)
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text_from_pdf(file_path)
        chunks = split_text(text)
        documents = [LangchainDocument(page_content=chunk) for chunk in chunks]
        save_to_chroma(topic_name=topic_name, chunks=documents)
        logger.info(f"Faculty uploaded and indexed: {file.filename} under topic '{topic_name}'")
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}",
        )

    return {"status": "success", "message": f"Document '{file.filename}' uploaded and indexed under topic '{topic_name}'"}


@faculty_router.post("/generate-quiz", response_model=QuizGenerateResponse)
async def faculty_generate_quiz(
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = TeacherQuizService(db)
    result = await service.generate_quiz(
        faculty_name=request.faculty_name,
        topic_name=request.topic_name,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
    )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Quiz generation failed"),
        )

    return QuizGenerateResponse(**result)


@faculty_router.get("/results/{quiz_id}", response_model=ResultResponse)
async def faculty_get_results(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = TeacherResultService(db)
    result = await service.get_results(quiz_id)
    return ResultResponse(**result)


@admin_router.get("/dashboard")
async def admin_dashboard(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    stats = await analytics.get_dashboard_stats()
    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "stats": stats,
    }


@admin_router.get("/users", response_model=UserListResponse)
async def admin_list_users(
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    skip = (page - 1) * page_size
    query = select(User).offset(skip).limit(page_size).order_by(User.created_at.desc())
    count_query = select(func.count()).select_from(User)
    result = await db.execute(query)
    total = await db.scalar(count_query)
    users = result.scalars().all()
    return UserListResponse(
        users=[UserDetailResponse.model_validate(u) for u in users],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@admin_router.get("/users/{user_id}", response_model=UserDetailResponse)
async def admin_get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@admin_router.patch(
    "/users/{user_id}/activate",
    response_model=UserDetailResponse,
    summary="Activate a user account",
)
async def admin_activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User account is already active",
        )
    user.is_active = True
    await db.flush()
    await db.refresh(user)
    return user


@admin_router.patch(
    "/users/{user_id}/deactivate",
    response_model=UserDetailResponse,
    summary="Deactivate a user account",
)
async def admin_deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User account is already inactive",
        )
    user.is_active = False
    await db.flush()
    await db.refresh(user)
    return user


@admin_router.get("/system-stats")
async def admin_system_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    analytics = AnalyticsService(db)
    return await analytics.get_admin_system_stats()
