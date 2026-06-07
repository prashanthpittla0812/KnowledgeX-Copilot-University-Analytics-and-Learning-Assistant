import os
import uuid
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.db import get_db
from app.database.models import User, LearningMaterial, MaterialActivity, MaterialBookmark, Notification
from app.auth.dependencies import get_current_user
from app.schemas.material_schema import MaterialResponse, MaterialUpdate, MaterialActivityCreate, NotificationResponse

router = APIRouter(prefix="/materials", tags=["Learning Materials"])

UPLOAD_DIR = "uploads/materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def check_role(current_user: User, allowed_roles: List[str]):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )

async def notify_students(db: AsyncSession, title: str, message: str):
    result = await db.execute(select(User).where(User.role == "student", User.is_active == True))
    students = result.scalars().all()
    for s in students:
        notif = Notification(user_id=s.id, title=title, message=message)
        db.add(notif)
    await db.commit()

# --- FACULTY ENDPOINTS ---

@router.post("/faculty", response_model=MaterialResponse)
async def upload_material(
    title: str = Form(...),
    material_type: str = Form(...),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    semester: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["faculty", "admin"])
    
    if material_type in ["LINK", "VIDEO"] and not link_url:
        raise HTTPException(status_code=400, detail="URL is required for LINK or VIDEO types")
    if material_type not in ["LINK", "VIDEO"] and not file:
        raise HTTPException(status_code=400, detail="File is required for this material type")
        
    file_url = link_url
    if file:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/api/v1/uploads/materials/{unique_filename}"
        
    new_material = LearningMaterial(
        title=title,
        description=description,
        subject=subject,
        topic=topic,
        department=department,
        semester=semester,
        material_type=material_type,
        file_url=file_url,
        faculty_id=current_user.id
    )
    db.add(new_material)
    await db.flush()
    await db.refresh(new_material)
    
    await notify_students(db, title="New Learning Material", message=f"A new {material_type} titled '{title}' has been uploaded by {current_user.name}.")
    
    return new_material

@router.get("/faculty", response_model=List[MaterialResponse])
async def get_faculty_materials(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["faculty", "admin"])
    
    query = select(LearningMaterial).where(LearningMaterial.faculty_id == current_user.id).order_by(LearningMaterial.created_at.desc())
    result = await db.execute(query)
    materials = result.scalars().all()
    
    response_list = []
    for m in materials:
        views_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id == m.id, MaterialActivity.action_type == 'VIEW'))
        views = views_res.scalar() or 0
        
        down_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id == m.id, MaterialActivity.action_type == 'DOWNLOAD'))
        downloads = down_res.scalar() or 0
        
        m_dict = {
            **m.__dict__,
            "views_count": views,
            "downloads_count": downloads
        }
        response_list.append(m_dict)
        
    return response_list

@router.delete("/faculty/{material_id}")
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["faculty", "admin"])
    
    result = await db.execute(select(LearningMaterial).where(LearningMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.faculty_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this material")
        
    await db.delete(material)
    await db.commit()
    return {"message": "Material deleted successfully"}

@router.get("/faculty/analytics")
async def get_faculty_analytics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["faculty", "admin"])
    
    materials_res = await db.execute(select(LearningMaterial.id).where(LearningMaterial.faculty_id == current_user.id))
    material_ids = [row for row in materials_res.scalars().all()]
    
    total_uploads = len(material_ids)
    
    if not material_ids:
        return {"total_uploads": 0, "total_views": 0, "total_downloads": 0, "most_viewed": None}
        
    views_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id.in_(material_ids), MaterialActivity.action_type == 'VIEW'))
    total_views = views_res.scalar() or 0
    
    down_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id.in_(material_ids), MaterialActivity.action_type == 'DOWNLOAD'))
    total_downloads = down_res.scalar() or 0
    
    # Most viewed
    most_viewed_res = await db.execute(
        select(MaterialActivity.material_id, func.count(MaterialActivity.id).label('count'))
        .where(MaterialActivity.material_id.in_(material_ids), MaterialActivity.action_type == 'VIEW')
        .group_by(MaterialActivity.material_id)
        .order_by(desc('count'))
        .limit(1)
    )
    most_viewed_row = most_viewed_res.first()
    
    most_viewed_title = None
    if most_viewed_row:
        mat_res = await db.execute(select(LearningMaterial).where(LearningMaterial.id == most_viewed_row.material_id))
        mat = mat_res.scalar_one_or_none()
        if mat:
            most_viewed_title = mat.title
            
    return {
        "total_uploads": total_uploads,
        "total_views": total_views,
        "total_downloads": total_downloads,
        "most_viewed": most_viewed_title
    }

# --- STUDENT ENDPOINTS ---

@router.get("/student", response_model=List[MaterialResponse])
async def get_student_materials(
    subject: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[str] = None,
    material_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["student", "admin"])
    
    query = select(LearningMaterial, User.name.label("faculty_name")).join(User, LearningMaterial.faculty_id == User.id).where(LearningMaterial.is_active == True)
    
    if subject: query = query.where(LearningMaterial.subject == subject)
    if department: query = query.where(LearningMaterial.department == department)
    if semester: query = query.where(LearningMaterial.semester == semester)
    if material_type: query = query.where(LearningMaterial.material_type == material_type)
    if search: query = query.where(LearningMaterial.title.ilike(f"%{search}%"))
        
    query = query.order_by(desc(LearningMaterial.created_at))
    result = await db.execute(query)
    rows = result.all()
    
    response_list = []
    for mat, faculty_name in rows:
        bm_res = await db.execute(select(MaterialBookmark).where(MaterialBookmark.material_id == mat.id, MaterialBookmark.student_id == current_user.id, MaterialBookmark.is_active == True))
        bm = bm_res.scalar_one_or_none()
        
        m_dict = {
            **mat.__dict__,
            "faculty_name": faculty_name,
            "is_bookmarked": bm is not None
        }
        response_list.append(m_dict)
        
    return response_list

@router.get("/student/recent", response_model=List[MaterialResponse])
async def get_recent_materials(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["student", "admin"])
    
    query = select(LearningMaterial, User.name.label("faculty_name"))\
        .join(User, LearningMaterial.faculty_id == User.id)\
        .where(LearningMaterial.is_active == True)\
        .order_by(desc(LearningMaterial.created_at))\
        .limit(10)
        
    result = await db.execute(query)
    rows = result.all()
    
    response_list = []
    for mat, faculty_name in rows:
        m_dict = {
            **mat.__dict__,
            "faculty_name": faculty_name
        }
        response_list.append(m_dict)
    return response_list

@router.post("/student/{material_id}/action")
async def track_material_action(material_id: int, action: MaterialActivityCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["student"])
    if action.action_type not in ['VIEW', 'DOWNLOAD']:
        raise HTTPException(status_code=400, detail="Invalid action type")
        
    activity = MaterialActivity(student_id=current_user.id, material_id=material_id, action_type=action.action_type)
    db.add(activity)
    await db.commit()
    return {"message": "Action tracked"}

@router.post("/student/{material_id}/bookmark")
async def toggle_bookmark(material_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_role(current_user, ["student"])
    
    bm_res = await db.execute(select(MaterialBookmark).where(MaterialBookmark.material_id == material_id, MaterialBookmark.student_id == current_user.id))
    bm = bm_res.scalar_one_or_none()
    
    if bm:
        bm.is_active = not bm.is_active
        await db.commit()
        return {"is_bookmarked": bm.is_active}
    else:
        new_bm = MaterialBookmark(student_id=current_user.id, material_id=material_id, is_active=True)
        db.add(new_bm)
        await db.commit()
        return {"is_bookmarked": True}

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id).order_by(desc(Notification.created_at)).limit(20))
    return result.scalars().all()

@router.post("/notifications/read")
async def mark_notifications_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await db.execute(update(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False).values(is_read=True))
    await db.commit()
    return {"message": "Notifications marked as read"}
