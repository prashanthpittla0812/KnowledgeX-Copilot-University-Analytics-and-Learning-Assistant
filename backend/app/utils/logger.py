import sys
from pathlib import Path

from loguru import logger

from app.config.settings import settings


def setup_logger() -> None:
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
    )

    log_file = Path(settings.LOG_FILE)
    log_file.parent.mkdir(parents=True, exist_ok=True)

    logger.add(
        settings.LOG_FILE,
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="30 days",
        compression="zip",
    )


def get_logger() -> logger:
    return logger
