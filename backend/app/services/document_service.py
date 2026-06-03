import shutil
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Document, User
from app.utils.constants import ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB, UPLOAD_DIR
from app.utils.logger import get_logger

logger = get_logger()


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_document(
        self, user: User, file_name: str, file_content: bytes
    ) -> Document:
        ext = Path(file_name).suffix.lower()
        if ext not in ALLOWED_FILE_EXTENSIONS:
            raise ValueError(f"File type {ext} not allowed. Use: {ALLOWED_FILE_EXTENSIONS}")

        if len(file_content) > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File size exceeds {MAX_FILE_SIZE_MB} MB limit")

        user_dir = UPLOAD_DIR / str(user.id)
        user_dir.mkdir(parents=True, exist_ok=True)

        file_path = user_dir / file_name
        with open(file_path, "wb") as f:
            f.write(file_content)

        document = Document(
            user_id=user.id,
            file_name=file_name,
            file_path=str(file_path),
        )
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        logger.info(f"Document uploaded: {file_name} by user {user.id}")
        return document

    async def get_user_documents(
        self, user: User, skip: int = 0, limit: int = 20
    ) -> tuple[list[Document], int]:
        query = select(Document).where(Document.user_id == user.id).offset(skip).limit(limit).order_by(Document.upload_date.desc())
        count_query = select(func.count()).select_from(Document).where(Document.user_id == user.id)
        result = await self.db.execute(query)
        total = await self.db.scalar(count_query)
        return list(result.scalars().all()), total or 0

    async def get_document(self, document_id: int, user: User) -> Document | None:
        query = select(Document).where(
            Document.id == document_id,
            Document.user_id == user.id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_document(self, document_id: int, user: User) -> bool:
        doc = await self.get_document(document_id, user)
        if not doc:
            return False
        file_path = Path(doc.file_path)
        if file_path.exists():
            file_path.unlink()
        await self.db.delete(doc)
        logger.info(f"Document deleted: {doc.file_name} by user {user.id}")
        return True
