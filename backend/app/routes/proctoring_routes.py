import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database.db import get_db
from app.auth.permissions import get_current_student, get_current_faculty
from app.database.models import User, QuizAttempt, ExamViolation, TeacherQuiz
from app.services.supabase_storage import SupabaseStorageService

router = APIRouter(prefix="/proctor", tags=["Proctoring"])

@router.post("/capture-photo")
async def capture_photo(
    quiz_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Capture initial photo before starting the quiz and mark quiz attempt as started.
    """
    # Fetch quiz attempt
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id)
        .where(QuizAttempt.student_id == current_user.id)
        .order_by(QuizAttempt.id.desc())
        .limit(1)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=current_user.id,
            status="IN_PROGRESS",
            total_violations=0,
            score=0,
            percentage=0,
            total_questions=0,
            correct_answers=0,
            wrong_answers=0
        )
        db.add(attempt)
        await db.flush()
        
    # Upload photo to Supabase
    filename = f"exam-photos/{current_user.id}_{quiz_id}_{uuid.uuid4().hex}.jpg"
    try:
        photo_url = await SupabaseStorageService.upload_file(file.file.read(), filename, content_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")
        
    attempt.start_photo_url = photo_url
    attempt.started_at = datetime.utcnow()
    attempt.status = "IN_PROGRESS"
    
    await db.commit()
    
    return {"message": "Photo uploaded successfully", "photo_url": photo_url}

@router.post("/upload-recording")
async def upload_recording(
    quiz_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Upload final video recording.
    """
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id)
        .where(QuizAttempt.student_id == current_user.id)
        .order_by(QuizAttempt.id.desc())
        .limit(1)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
        
    filename = f"exam-recordings/{current_user.id}_{quiz_id}_{uuid.uuid4().hex}.webm"
    try:
        recording_url = await SupabaseStorageService.upload_file(file.file.read(), filename, content_type="video/webm")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload recording: {str(e)}")
        
    attempt.recording_url = recording_url
    
    db.add(attempt)
    await db.commit()
    
    return {"message": "Recording uploaded successfully", "recording_url": recording_url}

@router.post("/log-violation")
async def log_violation(
    quiz_id: int = Form(...),
    violation_type: str = Form(...),
    details: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Log an exam violation (e.g. TAB_SWITCH, MOBILE_PHONE).
    Triggers auto-submit if max_violations is exceeded.
    """
    # Get Attempt and TeacherQuiz
    result = await db.execute(
        select(QuizAttempt, TeacherQuiz)
        .join(TeacherQuiz, QuizAttempt.quiz_id == TeacherQuiz.id)
        .where(QuizAttempt.quiz_id == quiz_id)
        .where(QuizAttempt.student_id == current_user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
        
    attempt, quiz = row
    
    if attempt.status != "IN_PROGRESS":
        return {"message": "Quiz is already submitted or ended", "auto_submit": False}
        
    # Log violation
    violation = ExamViolation(
        attempt_id=attempt.id,
        violation_type=violation_type,
        details=details
    )
    db.add(violation)
    
    attempt.total_violations += 1
    
    auto_submit = False
    max_v = quiz.max_violations or 3
    if attempt.total_violations >= max_v:
        auto_submit = True
        attempt.status = "AUTO_SUBMITTED"
        attempt.submitted_at = datetime.utcnow()
        
    db.add(attempt)
    await db.commit()
    
    return {
        "message": "Violation logged", 
        "total_violations": attempt.total_violations,
        "max_violations": max_v,
        "auto_submit": auto_submit
    }

@router.get("/faculty/quiz/{quiz_id}/monitoring")
async def get_quiz_monitoring(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_faculty: User = Depends(get_current_faculty)
):
    """
    Get all proctoring data for a specific quiz (only accessible by quiz creator).
    """
    # Verify ownership
    result = await db.execute(
        select(TeacherQuiz).where(TeacherQuiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.teacher_id != current_faculty.id:
        raise HTTPException(status_code=403, detail="Not authorized to view monitoring data for this quiz")
        
    # Fetch attempts and violations
    attempts_query = await db.execute(
        select(QuizAttempt, User.name, User.email)
        .join(User, QuizAttempt.student_id == User.id)
        .where(QuizAttempt.quiz_id == quiz_id)
    )
    
    monitoring_data = []
    for attempt, student_name, student_email in attempts_query.all():
        # Get violations for attempt
        v_query = await db.execute(
            select(ExamViolation).where(ExamViolation.attempt_id == attempt.id).order_by(ExamViolation.timestamp.desc())
        )
        violations = v_query.scalars().all()
        
        monitoring_data.append({
            "attempt_id": attempt.id,
            "student_id": attempt.student_id,
            "student_name": student_name,
            "student_email": student_email,
            "status": attempt.status,
            "score": attempt.score,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "start_photo_url": attempt.start_photo_url,
            "recording_url": attempt.recording_url,
            "total_violations": attempt.total_violations,
            "violations": [
                {
                    "type": v.violation_type,
                    "timestamp": v.timestamp,
                    "details": v.details
                } for v in violations
            ]
        })
        
    return {"quiz_id": quiz_id, "monitoring": monitoring_data}
