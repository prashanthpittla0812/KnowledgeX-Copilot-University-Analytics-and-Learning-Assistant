from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy import select, func, case
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
        
        today = datetime.utcnow().date()
        
        today_present = 0
        today_absent = 0
        
        # Get daily trends for the chart - last 5 days
        trends_result = await db.execute(
            select(
                func.date(Attendance.date).label("date"),
                func.sum(case((Attendance.status == 'present', 1), else_=0)).label("present_count"),
                func.sum(case((Attendance.status == 'absent', 1), else_=0)).label("absent_count")
            )
            .group_by(func.date(Attendance.date))
            .order_by(func.date(Attendance.date).desc())
            .limit(5)
        )
        
        trends = []
        for row in trends_result.all():
            trends.append({
                "date": str(row.date),
                "present_count": row.present_count,
                "absent_count": row.absent_count
            })
            if str(row.date) == str(today):
                today_present = row.present_count
                today_absent = row.absent_count
                
        # Reverse to show chronological order in chart
        trends.reverse()

        return {
            "summary": {
                "average_attendance_percentage": round(percentage, 2),
                "total_records": total_days,
                "total_present": present_days,
                "total_absent": absent_days,
                "today_present": today_present,
                "today_absent": today_absent
            },
            "trends": trends
        }

    @staticmethod
    async def get_student_stats(db: AsyncSession) -> List[Dict[str, Any]]:
        """Get attendance stats for all students."""
        result = await db.execute(
            select(
                User.id, 
                User.name, 
                Attendance.status
            )
            .outerjoin(Attendance, User.id == Attendance.student_id)
            .where(User.role == "student")
        )
        
        student_stats = {}
        for row in result.all():
            sid = row.id
            name = row.name
            status = row.status.lower() if row.status else None
            
            if sid not in student_stats:
                student_stats[sid] = {"name": name, "present": 0, "absent": 0, "total": 0}
            
            if status:
                student_stats[sid]["total"] += 1
                if status == "present":
                    student_stats[sid]["present"] += 1
                elif status == "absent":
                    student_stats[sid]["absent"] += 1
                
        stats_list = []
        for sid, stats in student_stats.items():
            pct = (stats["present"] / stats["total"] * 100) if stats["total"] > 0 else 0
            stats_list.append({
                "student_id": sid,
                "student_name": stats["name"],
                "present_days": stats["present"],
                "absent_days": stats["absent"],
                "total_days": stats["total"],
                "attendance_percentage": round(pct, 2)
            })
            
        stats_list.sort(key=lambda x: x["attendance_percentage"])
        return stats_list
