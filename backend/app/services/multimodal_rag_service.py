import os
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import ProcessedContent, User
from app.services.ocr_service import OCRService
from app.services.audio_processor import AudioProcessor
from app.services.video_processor import VideoProcessor
from app.utils.chunking import split_text
from app.utils.embeddings import get_vector_store
from app.utils.pdf_loader import extract_text_from_pdf

logger = logging.getLogger(__name__)

class MultimodalRAGService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ocr_service = OCRService()
        self.audio_processor = AudioProcessor()
        self.video_processor = VideoProcessor(self.audio_processor, self.ocr_service)
        self.vector_store = get_vector_store()

    async def process_upload(self, file_path: str, file_name: str, user: User, asr_provider: str = "Whisper") -> ProcessedContent:
        ext = Path(file_name).suffix.lower()
        source_type = "UNKNOWN"
        transcript = ""
        ocr_text = ""

        logger.info(f"Multimodal processing started for {file_name}")

        # Determine source type and process
        if ext in [".pdf"]:
            source_type = "PDF"
            try:
                transcript = extract_text_from_pdf(file_path)
            except Exception as e:
                logger.error(f"Failed to extract text from PDF via PyPDF: {e}")
            
            # Try OCR as fallback or supplementary if transcript is very short
            if len(transcript) < 100:
                try:
                    ocr_text = self.ocr_service.extract_text_from_scanned_pdf(file_path)
                except Exception as e:
                    logger.error(f"Failed to extract text from PDF via OCR: {e}")
            
        elif ext in [".txt", ".csv", ".md"]:
            source_type = "DOCUMENT"
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    transcript = f.read()
            except Exception as e:
                logger.error(f"Failed to read document {file_path}: {e}")

        elif ext in [".jpg", ".jpeg", ".png"]:
            source_type = "IMAGE"
            try:
                ocr_text = self.ocr_service.extract_text_from_image(file_path)
            except Exception as e:
                logger.error(f"Failed to extract text from image via OCR: {e}")
            
        elif ext in [".mp3", ".wav", ".m4a", ".flac"]:
            source_type = "AUDIO"
            try:
                transcript = self.audio_processor.transcribe_audio(file_path, provider=asr_provider)
            except Exception as e:
                logger.error(f"Failed to transcribe audio: {e}")
            
        elif ext in [".mp4", ".avi", ".mov", ".mkv"]:
            source_type = "VIDEO"
            try:
                results = self.video_processor.process_video(file_path, asr_provider=asr_provider)
                transcript = results.get("transcript", "")
                ocr_text = results.get("ocr_text", "")
            except Exception as e:
                logger.error(f"Failed to process video: {e}")
            
        else:
            raise ValueError(f"Unsupported file format for multimodal processing: {ext}")

        # Combine text for vectorization
        combined_text = f"Source: {file_name}\n"
        if transcript:
            combined_text += f"\n--- Text/Transcript ---\n{transcript}\n"
        if ocr_text:
            combined_text += f"\n--- Visual OCR Text ---\n{ocr_text}\n"

        # Save to database
        processed_content = ProcessedContent(
            title=file_name,
            source_type=source_type,
            transcript=transcript,
            ocr_text=ocr_text,
            file_path=file_path,
            uploaded_by=user.id
        )
        self.db.add(processed_content)
        await self.db.flush()
        await self.db.refresh(processed_content)

        # Vectorize and insert into ChromaDB
        if combined_text.strip():
            chunks = split_text(combined_text)
            valid_chunks = [c for c in chunks if c.strip()]
            
            if valid_chunks:
                # Prepare metadata for citations
                metadatas = [{
                    "source": file_name,
                    "source_type": source_type,
                    "content_id": processed_content.id,
                    "uploaded_by": user.id
                } for _ in valid_chunks]
                
                self.vector_store.add_texts(valid_chunks, metadatas=metadatas)
                logger.info(f"Indexed {len(valid_chunks)} chunks for {file_name}")

        return processed_content
