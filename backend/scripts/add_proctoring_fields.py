import asyncio
import sys
from pathlib import Path
from sqlalchemy import text
import logging

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database.db import AsyncSessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    async with AsyncSessionLocal() as session:
        try:
            logger.info("Adding proctoring columns to teacher_quizzes...")
            await session.execute(text("ALTER TABLE teacher_quizzes ADD COLUMN duration_minutes INTEGER DEFAULT 60;"))
            await session.execute(text("ALTER TABLE teacher_quizzes ADD COLUMN max_violations INTEGER DEFAULT 3;"))
        except Exception as e:
            logger.info(f"Columns might already exist in teacher_quizzes: {e}")

        try:
            logger.info("Adding proctoring columns to quiz_attempts...")
            await session.execute(text("ALTER TABLE quiz_attempts ADD COLUMN started_at TIMESTAMP;"))
            await session.execute(text("ALTER TABLE quiz_attempts ADD COLUMN start_photo_url VARCHAR(500);"))
            await session.execute(text("ALTER TABLE quiz_attempts ADD COLUMN recording_url VARCHAR(500);"))
            await session.execute(text("ALTER TABLE quiz_attempts ADD COLUMN total_violations INTEGER DEFAULT 0;"))
            await session.execute(text("ALTER TABLE quiz_attempts ADD COLUMN status VARCHAR(50) DEFAULT 'IN_PROGRESS';"))
        except Exception as e:
            logger.info(f"Columns might already exist in quiz_attempts: {e}")

        try:
            logger.info("Creating exam_violations table...")
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS exam_violations (
                    id SERIAL PRIMARY KEY,
                    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
                    violation_type VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    details TEXT
                );
            """))
            await session.execute(text("CREATE INDEX IF NOT EXISTS ix_exam_violations_id ON exam_violations(id);"))
        except Exception as e:
            logger.error(f"Failed to create exam_violations: {e}")

        await session.commit()
        logger.info("Database migration completed.")

if __name__ == "__main__":
    asyncio.run(main())
