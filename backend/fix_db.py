import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config.settings import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE quizzes ALTER COLUMN quiz_source DROP NOT NULL"))
            print("Successfully dropped NOT NULL constraint on quiz_source")
        except Exception as e:
            print("Could not drop quiz_source NOT NULL:", e)

        # Let's try inserting again to see if there are any MORE constraints
        try:
            await conn.execute(text("INSERT INTO quizzes (user_id, topic, score, quiz_data, created_at) VALUES (1, 'Test2', null, '{}', now())"))
            print("Insert succeeded! No more constraints failing.")
        except Exception as e:
            print("Insert failed again:", e)
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
