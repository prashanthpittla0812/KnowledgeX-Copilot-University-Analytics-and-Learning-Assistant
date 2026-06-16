import random
import string
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.auth.password import hash_password
from app.auth.permissions import get_current_admin
from app.database.db import get_db
from app.database.models import User, AuditLog, QuizAttempt, TeacherQuiz
from app.schemas.admin_schema import (
    AdminStudentResponse,
    AdminFacultyResponse,
    FacultyCreateRequest,
    FacultyCreateResponse,
    AdminResetPasswordResponse,
    AuditLogResponse,
    AdminDashboardAnalytics
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])

def generate_temp_password():
    return "Faculty@123"

def log_audit(db: AsyncSession, action: str, admin_id: int, target_id: Optional[int] = None):
    log = AuditLog(
        action=action,
        performed_by=admin_id,
        target_user=target_id,
        timestamp=datetime.utcnow()
    )
    db.add(log)

@router.get("/students", response_model=List[AdminStudentResponse])
async def get_students(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.role == "student")
    if status:
        query = query.where(User.status == status)
    query = query.order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/students/pending", response_model=List[AdminStudentResponse])
async def get_pending_students(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == "student", User.status == "PENDING"))
    return result.scalars().all()

@router.put("/students/{student_id}/approve")
async def approve_student(student_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.status = "APPROVED"
    student.approved_by = current_admin.id
    student.approved_at = datetime.utcnow()
    log_audit(db, "approve_student", current_admin.id, student.id)
    await db.commit()
    return {"message": "Student approved successfully"}

@router.put("/students/{student_id}/reject")
async def reject_student(student_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.status = "REJECTED"
    student.rejected_at = datetime.utcnow()
    log_audit(db, "reject_student", current_admin.id, student.id)
    await db.commit()
    return {"message": "Student rejected successfully"}

@router.put("/students/{student_id}/reset-password", response_model=AdminResetPasswordResponse)
async def reset_student_password(student_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    temp_password = "Student@123"
    student.password_hash = hash_password(temp_password)
    student.must_change_password = True
    
    log_audit(db, "reset_student_password", current_admin.id, student.id)
    await db.commit()
    
    return AdminResetPasswordResponse(
        id=student.id,
        new_password=temp_password
    )

@router.delete("/students/{student_id}")
async def delete_student(student_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.delete(student)
    log_audit(db, "delete_student", current_admin.id, student.id)
    await db.commit()
    return {"message": "Student deleted successfully"}



@router.post("/faculty", response_model=FacultyCreateResponse)
async def create_faculty(request: FacultyCreateRequest, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    temp_password = generate_temp_password()
    faculty = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(temp_password),
        role="faculty",
        status="APPROVED",
        department=request.department,
        designation=request.designation,
        must_change_password=True,
        approved_by=current_admin.id,
        approved_at=datetime.utcnow()
    )
    db.add(faculty)
    await db.flush()
    await db.refresh(faculty)
    log_audit(db, "create_faculty", current_admin.id, faculty.id)
    await db.commit()
    
    return FacultyCreateResponse(
        id=faculty.id,
        name=faculty.name,
        email=faculty.email,
        temporary_password=temp_password
    )

@router.get("/faculty", response_model=List[AdminFacultyResponse])
async def get_faculty(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == "faculty").order_by(User.created_at.desc()))
    return result.scalars().all()

@router.put("/faculty/{faculty_id}/reset-password", response_model=AdminResetPasswordResponse)
async def reset_faculty_password(faculty_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == faculty_id, User.role == "faculty"))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    temp_password = generate_temp_password()
    faculty.password_hash = hash_password(temp_password)
    faculty.must_change_password = True
    
    log_audit(db, "reset_faculty_password", current_admin.id, faculty.id)
    await db.commit()
    
    return AdminResetPasswordResponse(
        id=faculty.id,
        new_password=temp_password
    )

@router.delete("/faculty/{faculty_id}")
async def deactivate_faculty(faculty_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.id == faculty_id, User.role == "faculty"))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    faculty.is_active = False
    log_audit(db, "deactivate_faculty", current_admin.id, faculty.id)
    await db.commit()
    return {"message": "Faculty deactivated successfully"}

@router.get("/analytics", response_model=AdminDashboardAnalytics)
async def get_admin_analytics(db: AsyncSession = Depends(get_db)):
    total_students = await db.scalar(select(func.count()).select_from(User).where(User.role == "student")) or 0
    approved_students = await db.scalar(select(func.count()).select_from(User).where(User.role == "student", User.status == "APPROVED")) or 0
    pending_students = await db.scalar(select(func.count()).select_from(User).where(User.role == "student", User.status == "PENDING")) or 0
    rejected_students = await db.scalar(select(func.count()).select_from(User).where(User.role == "student", User.status == "REJECTED")) or 0
    
    total_faculty = await db.scalar(select(func.count()).select_from(User).where(User.role == "faculty")) or 0
    active_faculty = await db.scalar(select(func.count()).select_from(User).where(User.role == "faculty", User.is_active == True)) or 0
    
    total_quizzes = await db.scalar(select(func.count()).select_from(TeacherQuiz)) or 0
    total_quiz_attempts = await db.scalar(select(func.count()).select_from(QuizAttempt)) or 0
    average_performance = await db.scalar(select(func.avg(QuizAttempt.percentage))) or 0.0
    
    return AdminDashboardAnalytics(
        total_students=total_students,
        approved_students=approved_students,
        pending_students=pending_students,
        rejected_students=rejected_students,
        total_faculty=total_faculty,
        active_faculty=active_faculty,
        total_quizzes=total_quizzes,
        total_quiz_attempts=total_quiz_attempts,
        average_performance=round(float(average_performance), 2)
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    performer_alias = aliased(User)
    target_alias = aliased(User)
    
    query = (
        select(
            AuditLog.id,
            AuditLog.action,
            AuditLog.timestamp,
            performer_alias.name.label("performed_by_name"),
            target_alias.name.label("target_user_name")
        )
        .join(performer_alias, AuditLog.performed_by == performer_alias.id)
        .outerjoin(target_alias, AuditLog.target_user == target_alias.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(100)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        AuditLogResponse(
            id=row.id,
            action=row.action,
            performed_by_name=row.performed_by_name,
            target_user_name=row.target_user_name,
            timestamp=row.timestamp
        )
        for row in rows
    ]
