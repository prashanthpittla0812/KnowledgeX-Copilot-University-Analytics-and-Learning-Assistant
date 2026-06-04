from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "KnowledgeX Copilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/knowledgex"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI Provider
    AI_PROVIDER: Literal["openai", "azure", "ollama"] = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_KEY: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-10-21"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # ChromaDB
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"

    # File Uploads
    UPLOAD_DIRECTORY: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/knowledgex.log"

    @property
    def UPLOAD_PATH(self) -> Path:
        return Path(self.UPLOAD_DIRECTORY)

    @property
    def CHROMA_PATH(self) -> Path:
        return Path(self.CHROMA_PERSIST_DIRECTORY)

    @property
    def MAX_UPLOAD_SIZE_BYTES(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
