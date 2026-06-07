import os
import logging
from pathlib import Path
from app.services.audio_processor import AudioProcessor
from app.services.ocr_service import OCRService

try:
    from moviepy import VideoFileClip
except ImportError:
    VideoFileClip = None

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self, audio_processor: AudioProcessor, ocr_service: OCRService):
        self.audio_processor = audio_processor
        self.ocr_service = ocr_service

    def process_video(self, file_path: str, asr_provider: str = "Whisper") -> dict:
        """
        Extracts audio and transcribes it.
        Extracts frames periodically and performs OCR.
        Returns a combined dictionary.
        """
        if VideoFileClip is None:
            raise RuntimeError("moviepy is not installed")
            
        logger.info(f"Processing video {file_path}")
        
        # Extract audio
        audio_path = f"{file_path}.wav"
        transcript = ""
        try:
            video = VideoFileClip(file_path)
            if video.audio:
                video.audio.write_audiofile(audio_path, logger=None)
                transcript = self.audio_processor.transcribe_audio(audio_path, provider=asr_provider)
            video.close()
        except Exception as e:
            logger.error(f"Error extracting audio from video {file_path}: {e}")
        finally:
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception as e:
                    logger.error(f"Failed to remove temp audio {audio_path}: {e}")

        # Extract frames and OCR
        ocr_text = self._extract_frames_ocr(file_path)
        
        return {
            "transcript": transcript,
            "ocr_text": ocr_text
        }
        
    def _extract_frames_ocr(self, file_path: str) -> str:
        if cv2 is None:
            logger.warning("opencv-python not installed, skipping frame OCR")
            return ""
            
        try:
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                return ""
                
            fps = cap.get(cv2.CAP_PROP_FPS)
            # Sample 1 frame every 10 seconds
            frame_interval = int(fps * 10) if fps > 0 else 300
            
            frame_texts = []
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                if frame_count % frame_interval == 0:
                    # Save frame to temp file for OCR
                    temp_img_path = f"{file_path}_frame_{frame_count}.jpg"
                    cv2.imwrite(temp_img_path, frame)
                    text = self.ocr_service.extract_text_from_image(temp_img_path)
                    if text.strip():
                        # add timestamp citation prefix
                        seconds = int(frame_count / fps) if fps > 0 else 0
                        mins, secs = divmod(seconds, 60)
                        frame_texts.append(f"[Timestamp {mins:02d}:{secs:02d}]: {text}")
                    
                    if os.path.exists(temp_img_path):
                        os.remove(temp_img_path)
                
                frame_count += 1
                
            cap.release()
            return "\n\n".join(frame_texts)
        except Exception as e:
            logger.error(f"Error extracting frames for OCR from {file_path}: {e}")
            return ""
