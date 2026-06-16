import asyncio
import traceback
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config.settings import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text("INSERT INTO quizzes (user_id, topic, score, quiz_data, created_at) VALUES (1, 'Test', null, '{}', now())")
            )
        print("Success!")
    except Exception as e:
        print("Error during insert:")
        traceback.print_exc()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
