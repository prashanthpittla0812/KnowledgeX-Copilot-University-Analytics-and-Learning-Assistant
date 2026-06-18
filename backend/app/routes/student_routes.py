import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import settings
from app.database.db import get_db
from app.auth.permissions import get_current_student
from app.database.models import User, TeacherQuiz, AssessmentSubmission
from app.schemas.teacher_schema import (
    StudentQuizEvalRequest,
    StudentQuizEvalResponse,
    StudentQuizGenRequest,
    StudentQuizGenResponse,
    StudentQuizResponse,
    StudentQuizSubmission,
    StudentSubmitResponse,
)
from app.services.student_quiz_gen_service import StudentQuizGenService
from app.services.student_service import StudentQuizService, StudentSubmitService

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/assigned-quizzes")
async def get_assigned_quizzes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    service = StudentQuizService(db)
    quizzes = await service.get_all_quizzes(student_id=current_user.id)
    return {"quizzes": quizzes}


@router.get("/quiz/{quiz_id}", response_model=StudentQuizResponse)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizService(db)
    result = await service.get_quiz(quiz_id)
    if not result["questions"]:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )
    return StudentQuizResponse(**result)


@router.post("/submit", response_model=StudentSubmitResponse)
async def submit_quiz(
    request: StudentQuizSubmission,
    db: AsyncSession = Depends(get_db),
):
    service = StudentSubmitService(db)
    result = await service.submit_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers,
    )
    return StudentSubmitResponse(**result)


@router.post("/quiz/generate", response_model=StudentQuizGenResponse)
async def generate_quiz(
    request: StudentQuizGenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizGenService(db)
    result = await service.generate_quiz(
        topic_name=request.topic_name,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
    )
    if result.get("status") == "error":
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Quiz generation failed"),
        )
    return StudentQuizGenResponse(**result)


@router.post("/quiz/evaluate", response_model=StudentQuizEvalResponse)
async def evaluate_quiz(
    request: StudentQuizEvalRequest,
    db: AsyncSession = Depends(get_db),
):
    service = StudentQuizGenService(db)
    result = await service.evaluate_quiz(
        quiz_id=request.quiz_id,
        student_name=request.student_name,
        answers=request.answers,
    )
    return StudentQuizEvalResponse(**result)


@router.post("/assessment/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    result = await db.execute(select(TeacherQuiz).where(TeacherQuiz.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    result = await db.execute(
        select(AssessmentSubmission)
        .where(AssessmentSubmission.assessment_id == assessment_id)
        .where(AssessmentSubmission.student_id == current_user.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Assessment already submitted")
        
    upload_dir = settings.UPLOAD_PATH / "submissions"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path_relative = f"uploads/submissions/{current_user.id}_{assessment_id}_{file.filename}"
    file_path = str(upload_dir / f"{current_user.id}_{assessment_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    submission = AssessmentSubmission(
        assessment_id=assessment_id,
        student_id=current_user.id,
        file_path=file_path_relative,
        file_name=file.filename,
    )
    db.add(submission)
    await db.commit()
    return {"status": "success", "message": "Assessment submitted successfully"}


@router.get("/assessment/{assessment_id}/status")
async def get_assessment_status(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    result = await db.execute(
        select(AssessmentSubmission)
        .where(AssessmentSubmission.assessment_id == assessment_id)
        .where(AssessmentSubmission.student_id == current_user.id)
    )
    submission = result.scalar_one_or_none()
    if submission:
        return {"submitted": True, "file_name": submission.file_name, "submitted_at": submission.submitted_at}
    return {"submitted": False}
