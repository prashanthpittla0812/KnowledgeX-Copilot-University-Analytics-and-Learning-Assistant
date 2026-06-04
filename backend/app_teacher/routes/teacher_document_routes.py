from fastapi import APIRouter, UploadFile, File

from app.services.teacher_document_service import (
    teacher_document_service
)

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher Documents"]
)


@router.post("/upload")
async def upload_document(
    topic_name: str,
    file: UploadFile = File(...)
):

    return await teacher_document_service.upload_document(
        topic_name,
        file
    )