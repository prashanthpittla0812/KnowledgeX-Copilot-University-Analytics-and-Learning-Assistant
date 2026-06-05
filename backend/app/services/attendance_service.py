from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Attendance, User


class AttendanceService:
    @staticmethod
    async def mark_attendance(
        db: AsyncSession, student_id: int, status: str
    ) -> Attendance:
        """Mark attendance for a student for today."""
        record = Attendance(student_id=student_id, status=status)
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_student_attendance(db: AsyncSession, student_id: int) -> Dict[str, Any]:
        """Get attendance summary for a specific student."""
        result = await db.execute(
            select(Attendance.status, func.count(Attendance.id))
            .where(Attendance.student_id == student_id)
            .group_by(Attendance.status)
        )
        counts = result.all()
        
        present_days = 0
        absent_days = 0
        
        for status, count in counts:
            if status.lower() == "present":
                present_days = count
            elif status.lower() == "absent":
                absent_days = count
                
        total_days = present_days + absent_days
        percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        return {
            "present_days": present_days,
            "absent_days": absent_days,
            "total_days": total_days,
            "attendance_percentage": round(percentage, 2),
            "status": "Warning: Low Attendance" if percentage < 75 and total_days > 0 else "Good"
        }

    @staticmethod
    async def get_class_attendance(db: AsyncSession) -> Dict[str, Any]:
        """Get attendance summary for the entire class (Faculty Analytics)."""
        result = await db.execute(
            select(Attendance.status, func.count(Attendance.id))
            .group_by(Attendance.status)
        )
        counts = result.all()
        
        present_days = 0
        absent_days = 0
        
        for status, count in counts:
            if status.lower() == "present":
                present_days = count
            elif status.lower() == "absent":
                absent_days = count
                
        total_days = present_days + absent_days
        percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        # Get list of students with low attendance
        students_result = await db.execute(
            select(
                User.id, 
                User.name,
                func.sum(case((Attendance.status == 'present', 1), else_=0)).label('present'),
                func.count(Attendance.id).label('total')
            )
            .join(Attendance, User.id == Attendance.student_id)
            .where(User.role == 'student')
            .group_by(User.id, User.name)
        )
        
        at_risk_students = []
        # Fallback raw calculation since case/func can be tricky in SQLAlchemy sometimes
        # We will just fetch all students and calculate if it gets complex, but let's do a simple query.
        pass # To be safe, we'll write a cleaner SQLAlchemy query for at-risk below.

        return {
            "average_attendance_percentage": round(percentage, 2),
            "total_records": total_days
        }

    @staticmethod
    async def get_at_risk_students(db: AsyncSession) -> List[Dict[str, Any]]:
        """Identify students with attendance < 75%."""
        # Fetch all attendance grouped by student
        result = await db.execute(
            select(
                User.id, 
                User.name, 
                Attendance.status
            )
            .join(Attendance, User.id == Attendance.student_id)
            .where(User.role == "student")
        )
        
        student_stats = {}
        for row in result.all():
            sid = row.id
            name = row.name
            status = row.status.lower()
            
            if sid not in student_stats:
                student_stats[sid] = {"name": name, "present": 0, "total": 0}
            
            student_stats[sid]["total"] += 1
            if status == "present":
                student_stats[sid]["present"] += 1
                
        at_risk = []
        for sid, stats in student_stats.items():
            pct = (stats["present"] / stats["total"] * 100) if stats["total"] > 0 else 0
            if pct < 75 and stats["total"] > 0:
                at_risk.append({
                    "student_id": sid,
                    "student_name": stats["name"],
                    "attendance_percentage": round(pct, 2)
                })
                
        return at_risk
