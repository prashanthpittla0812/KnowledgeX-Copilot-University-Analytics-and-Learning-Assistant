import io
from pathlib import Path
from typing import List
import logging

try:
    from PIL import Image
    import pytesseract
    from pdf2image import convert_from_path
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except ImportError:
    Image = None
    pytesseract = None
    convert_from_path = None

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        if pytesseract is None:
            logger.warning("pytesseract or pdf2image is not installed. OCR will not work.")

    def extract_text_from_image(self, file_path: str) -> str:
        if pytesseract is None:
            raise RuntimeError("pytesseract is not installed")
        
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from image {file_path}: {e}")
            return ""

    def extract_text_from_scanned_pdf(self, file_path: str) -> str:
        if convert_from_path is None:
            raise RuntimeError("pdf2image is not installed")
            
        try:
            images = convert_from_path(file_path)
            full_text = []
            for i, img in enumerate(images):
                logger.info(f"Processing page {i+1} of {file_path} via OCR")
                text = pytesseract.image_to_string(img)
                full_text.append(text)
            return "\n\n".join(full_text).strip()
        except Exception as e:
            logger.error(f"Error extracting text from scanned PDF {file_path}: {e}")
            return ""
