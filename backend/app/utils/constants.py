from pathlib import Path

APP_NAME = "KnowledgeX Copilot"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "AI-Powered University Analytics and Learning Assistant"

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = PROJECT_ROOT / "app" / "uploads"
CHROMA_DIR = PROJECT_ROOT / "chroma_db"
LOG_DIR = PROJECT_ROOT / "logs"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

ALLOWED_FILE_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE_MB = 50

ROLES = ["student", "faculty", "admin"]
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
