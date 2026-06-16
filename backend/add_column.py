import asyncio
from sqlalchemy import text
from app.database.db import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS attempt_type VARCHAR(50) NOT NULL DEFAULT 'practice';"))
            print("Successfully added attempt_type column!")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
