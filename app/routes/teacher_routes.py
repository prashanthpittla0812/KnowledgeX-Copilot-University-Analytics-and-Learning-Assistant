from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.services.document_service import process_document

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher"]
)


@router.get("/")
def teacher_home():

    return {
        "message": "Teacher Module Running"
    }


@router.post("/upload")
async def upload_document(
    topic_name: str,
    file: UploadFile = File(...)
):

    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    process_document(
        file_path=file_path,
        topic_name=topic_name
    )

    return {
        "message": "Teacher document processed successfully"
    }