from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

import os

from app.services.document_service import (
    process_document
)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "app/uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.post("/upload")
async def upload_document(
        topic_name: str,
        file: UploadFile = File(...)
):

    file_path = (
        f"{UPLOAD_DIR}/"
        f"{file.filename}"
    )

    with open(
            file_path,
            "wb"
    ) as f:

        f.write(
            await file.read()
        )

    process_document(
        file_path,
        topic_name
    )

    return {
        "message":
        "Document processed successfully"
    }