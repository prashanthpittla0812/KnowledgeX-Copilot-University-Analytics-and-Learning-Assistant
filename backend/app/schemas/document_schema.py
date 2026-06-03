from datetime import datetime

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    id: int
    file_name: str
    upload_date: datetime
    message: str = "File uploaded successfully"

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_path: str
    upload_date: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
