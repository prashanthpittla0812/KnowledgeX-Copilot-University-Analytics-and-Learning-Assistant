import os
import uuid
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import get_db
# Notice we import LearningMaterial here instead of Material
from app.database.models import User, LearningMaterial, MaterialActivity, MaterialBookmark, Notification
from app.auth.dependencies import get_current_user
from app.schemas.material_schema import MaterialResponse, MaterialActivityCreate, NotificationResponse

router = APIRouter(prefix="/materials", tags=["Learning Materials"])

UPLOAD_DIR = "uploads/materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ... rest of your route code below remains exactly the same!


# ✅ Safe serializer
def model_to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


async def check_role(current_user: User, allowed_roles: List[str]):
    if not current_user or not hasattr(current_user, "role"):
        raise HTTPException(status_code=403, detail="You do not have permission")
    role = str(current_user.role).strip().lower()
    allowed = [r.strip().lower() for r in allowed_roles]
    print(f"DEBUG check_role: user_id={current_user.id}, role='{role}', allowed={allowed}")
    if role not in allowed:
        raise HTTPException(status_code=403, detail=f"You do not have permission. Role: {role}")


async def notify_students(db: AsyncSession, title: str, message: str, link: str = None):
    result = await db.execute(select(User).where(User.role == "student", User.is_active == True))
    students = result.scalars().all()

    for s in students:
        db.add(Notification(user_id=s.id, title=title, message=message, link=link))

    await db.commit()


# ------------------ FACULTY ------------------

@router.post("/faculty", response_model=MaterialResponse)
async def upload_material(
    title: str = Form(...),
    material_type: str = Form(...),
    description: Optional[str] = Form(None),
    subject: str = Form(...),
    topic: str = Form(...),
    department: Optional[str] = Form(None),
    semester: Optional[int] = Form(None),
    link_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["faculty", "admin"])

    if material_type in ["LINK", "VIDEO"] and not link_url:
        raise HTTPException(400, "URL required")
    if material_type not in ["LINK", "VIDEO"] and not file:
        raise HTTPException(400, "File required")

    file_url = link_url

    if file:
        ext = os.path.splitext(file.filename)[1]
        name = f"{uuid.uuid4()}{ext}"
        path = os.path.join(UPLOAD_DIR, name)

        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_url = f"/uploads/materials/{name}"

    material = LearningMaterial(
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

    db.add(material)
    await db.flush()
    await db.refresh(material)

    await notify_students(
        db,
        "New Learning Material",
        f"{title} uploaded by {current_user.name}",
        link="Learning Resources"
    )

    return material


@router.get("/faculty", response_model=List[MaterialResponse])
async def get_faculty_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["faculty", "admin"])

    result = await db.execute(
        select(LearningMaterial)
        .where(LearningMaterial.faculty_id == current_user.id)
        .order_by(desc(LearningMaterial.created_at))
    )

    materials = result.scalars().all()
    response = []

    for m in materials:
        views = await db.scalar(
            select(func.count()).where(
                MaterialActivity.material_id == m.id,
                MaterialActivity.action_type == 'VIEW'
            )
        ) or 0

        downloads = await db.scalar(
            select(func.count()).where(
                MaterialActivity.material_id == m.id,
                MaterialActivity.action_type == 'DOWNLOAD'
            )
        ) or 0

        data = model_to_dict(m)
        data["views_count"] = views
        data["downloads_count"] = downloads

        response.append(data)

    return response


@router.delete("/faculty/{material_id}")
async def delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["faculty", "admin"])

    res = await db.execute(select(LearningMaterial).where(LearningMaterial.id == material_id))
    material = res.scalar_one_or_none()

    if not material:
        raise HTTPException(404, "Not found")

    if material.faculty_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")

    await db.delete(material)
    await db.commit()

    return {"message": "Deleted"}


# ------------------ STUDENT ------------------

@router.get("/student", response_model=List[MaterialResponse])
async def get_student_materials(
    subject: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    material_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["student", "admin", "faculty"])

    query = select(LearningMaterial, User.name).join(User)

    if subject:
        query = query.where(LearningMaterial.subject == subject)
    if department:
        query = query.where(LearningMaterial.department == department)
    if semester:
        query = query.where(LearningMaterial.semester == semester)
    if material_type:
        query = query.where(LearningMaterial.material_type == material_type)
    if search:
        query = query.where(LearningMaterial.title.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(desc(LearningMaterial.created_at)))
    rows = result.all()

    response = []

    for mat, faculty_name in rows:

        # bookmark
        bm = await db.scalar(
            select(MaterialBookmark).where(
                MaterialBookmark.material_id == mat.id,
                MaterialBookmark.student_id == current_user.id,
                MaterialBookmark.is_active == True
            )
        )

        # views
        views = await db.scalar(
            select(func.count()).where(
                MaterialActivity.material_id == mat.id,
                MaterialActivity.action_type == 'VIEW'
            )
        ) or 0

        # downloads
        downloads = await db.scalar(
            select(func.count()).where(
                MaterialActivity.material_id == mat.id,
                MaterialActivity.action_type == 'DOWNLOAD'
            )
        ) or 0

        data = {
            **model_to_dict(mat),
            "faculty_name": faculty_name,
            "is_bookmarked": bm is not None,
            "views_count": views,
            "downloads_count": downloads,
        }

        response.append(data)

    return response


@router.post("/student/{material_id}/action")
async def track_action(
    material_id: int,
    action: MaterialActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["student", "faculty", "admin"])

    if action.action_type not in ['VIEW', 'DOWNLOAD']:
        raise HTTPException(400, "Invalid action")

    db.add(MaterialActivity(
        student_id=current_user.id,
        material_id=material_id,
        action_type=action.action_type
    ))

    await db.commit()
    return {"message": "Tracked"}


@router.post("/student/{material_id}/bookmark")
async def bookmark(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["student", "faculty", "admin"])

    bm = await db.scalar(
        select(MaterialBookmark).where(
            MaterialBookmark.material_id == material_id,
            MaterialBookmark.student_id == current_user.id
        )
    )

    if bm:
        bm.is_active = not bm.is_active
    else:
        bm = MaterialBookmark(
            student_id=current_user.id,
            material_id=material_id,
            is_active=True
        )
        db.add(bm)

    await db.commit()
    return {"message": "Updated", "is_bookmarked": bm.is_active}


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(20)
    )

    return result.scalars().all()


@router.post("/notifications/read")
async def mark_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )

    await db.commit()
    return {"message": "Read"}

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = res.scalar_one_or_none()

    if not notification:
        raise HTTPException(404, "Notification not found")

    await db.delete(notification)
    await db.commit()
    return {"message": "Deleted"}
@router.get("/student/recent")
async def get_recent_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_role(current_user, ["student", "admin", "faculty"])

    result = await db.execute(
        select(LearningMaterial)
        .order_by(desc(LearningMaterial.created_at))
        .limit(5)
    )

    materials = result.scalars().all()
    return materials