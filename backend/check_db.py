import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    engine = create_async_engine(os.getenv('DATABASE_URL'))
    async with engine.begin() as conn:
        res = await conn.execute(text('SELECT id, student_id, start_photo_url, recording_url FROM quiz_attempts ORDER BY id DESC LIMIT 5'))
        print(res.fetchall())
    await engine.dispose()

asyncio.run(run())
