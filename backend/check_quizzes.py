import asyncio
from sqlalchemy import text
from app.database.db import async_session_factory

async def main():
    async with async_session_factory() as db:
        # Check all quizzes
        r = await db.execute(text("SELECT id, topic_name, teacher_id, teacher_name, created_at FROM teacher_quizzes"))
        rows = r.all()
        print(f"\n=== Quizzes ({len(rows)} total) ===")
        for row in rows:
            print(f"  id={row[0]}, topic_name='{row[1]}', teacher_id={row[2]}, teacher_name='{row[3]}', created_at='{row[4]}'")

asyncio.run(main())
