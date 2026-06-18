import asyncio
import sys
from pathlib import Path
from sqlalchemy import text
import logging

# Add the parent directory to sys.path so we can import from app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Adding email_type column to users table...")
    async with engine.begin() as conn:
        try:
            # We'll default to EXTERNAL for existing users to be safe, 
            # or we could deduce from email. Let's do a simple ALTER TABLE first.
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_type VARCHAR(50);"))
            
            # Now update existing users based on email
            await conn.execute(text("UPDATE users SET email_type = 'DOMAIN' WHERE email LIKE '%@ifheindia.org';"))
            await conn.execute(text("UPDATE users SET email_type = 'EXTERNAL' WHERE email_type IS NULL;"))
            
            logger.info("Successfully added email_type column and backfilled data!")
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
