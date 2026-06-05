from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.auth.permissions import get_current_student, get_current_faculty
from app.database.db import get_db
from app.database.models import User
from app.services.attendance_service import AttendanceService
from pydantic import BaseModel

router = APIRouter(prefix="/attendance", tags=["Attendance"])

class MarkAttendanceRequest(BaseModel):
    status: str

@router.post("/mark", status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    request: MarkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    if request.status.lower() not in ["present", "absent"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present' or 'absent'.")
        
    await AttendanceService.mark_attendance(db, current_user.id, request.status)
    return {"message": "Attendance marked successfully"}

@router.get("/student/me")
async def get_my_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    return await AttendanceService.get_student_attendance(db, current_user.id)

@router.get("/class")
async def get_class_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    return await AttendanceService.get_class_attendance(db)

@router.get("/at-risk")
async def get_at_risk_students(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    return {"at_risk": await AttendanceService.get_at_risk_students(db)}
