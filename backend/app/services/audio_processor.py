import os
import logging
from typing import Optional

try:
    from faster_whisper import WhisperModel
    has_whisper = True
except ImportError:
    has_whisper = False

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.model = None
        self.is_loaded = False

    def load_model(self):
        if not self.is_loaded and has_whisper:
            logger.info("Loading faster-whisper model for ASR...")
            # Use 'base' for faster processing in a demo environment
            self.model = WhisperModel("base", device="cpu", compute_type="int8")
            self.is_loaded = True

    def transcribe_audio(self, file_path: str, provider: str = "Whisper") -> str:
        """
        Transcribes audio using the selected provider.
        Providers: Whisper, Vibe Voice, Gonthuka
        """
        logger.info(f"Transcribing audio {file_path} using provider {provider}")
        
        if provider.lower() == "whisper":
            if not has_whisper:
                raise RuntimeError("faster-whisper is not installed")
            
            self.load_model()
            try:
                segments, info = self.model.transcribe(file_path, beam_size=5)
                text = " ".join([segment.text for segment in segments])
                return text.strip()
            except Exception as e:
                logger.error(f"Error transcribing audio {file_path}: {e}")
                return ""
        
        elif provider.lower() == "vibe voice":
            logger.info("Using simulated Vibe Voice ASR")
            return f"[Vibe Voice Transcript for {os.path.basename(file_path)}] - Simulated output for integration."
            
        elif provider.lower() == "gonthuka":
            logger.info("Using simulated Gonthuka ASR")
            return f"[Gonthuka ASR Transcript for {os.path.basename(file_path)}] - Simulated output for integration."
            
        else:
            raise ValueError(f"Unknown ASR provider: {provider}")
