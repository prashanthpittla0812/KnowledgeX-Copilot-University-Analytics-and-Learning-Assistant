from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.auth.permissions import require_role
from app.config.settings import settings
from app.database.db import get_db
from app.database.models import User
from app.schemas.document_schema import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.services.multimodal_rag_service import MultimodalRAGService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    doc_service = DocumentService(db)
    try:
        content = await file.read()
        document = await doc_service.upload_document(
            user=current_user,
            file_name=file.filename,
            file_content=content,
        )
        rag = RAGService()
        rag.load_and_index_pdf(document.file_path)
        return DocumentUploadResponse(
            id=document.id,
            file_name=document.file_name,
            upload_date=document.upload_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/multimodal/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_multimodal_document(
    file: UploadFile = File(...),
    asr_provider: str = Form("Whisper"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    try:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File size exceeds limit")
            
        user_dir = settings.UPLOAD_PATH / str(current_user.id)
        user_dir.mkdir(parents=True, exist_ok=True)
        file_path = user_dir / file.filename
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        rag_service = MultimodalRAGService(db)
        processed_content = await rag_service.process_upload(
            file_path=str(file_path),
            file_name=file.filename,
            user=current_user,
            asr_provider=asr_provider
        )
        
        return DocumentUploadResponse(
            id=processed_content.id,
            file_name=processed_content.title,
            upload_date=processed_content.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/multimodal/upload-batch", status_code=status.HTTP_201_CREATED)
async def upload_multimodal_batch(
    files: list[UploadFile] = File(...),
    asr_provider: str = Form("Whisper"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    try:
        user_dir = settings.UPLOAD_PATH / str(current_user.id)
        user_dir.mkdir(parents=True, exist_ok=True)
        rag_service = MultimodalRAGService(db)
        
        uploaded_docs = []
        for file in files:
            content = await file.read()
            if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
                continue # Skip large files in batch
                
            file_path = user_dir / file.filename
            with open(file_path, "wb") as f:
                f.write(content)
                
            processed_content = await rag_service.process_upload(
                file_path=str(file_path),
                file_name=file.filename,
                user=current_user,
                asr_provider=asr_provider
            )
            uploaded_docs.append({
                "id": processed_content.id,
                "file_name": processed_content.title
            })
            
        return {"uploaded": uploaded_docs}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    doc_service = DocumentService(db)
    documents, total = await doc_service.get_user_documents(
        user=current_user, skip=skip, limit=limit
    )
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=total,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    doc_service = DocumentService(db)
    document = await doc_service.get_document(document_id, current_user)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student", "faculty")),
):
    doc_service = DocumentService(db)
    deleted = await doc_service.delete_document(document_id, current_user)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
