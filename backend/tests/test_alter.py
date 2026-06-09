from app.config.settings import settings
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
import traceback

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    try:
        async with AsyncSession(engine) as session:
            await session.execute(text("ALTER TABLE material_activities ADD COLUMN action_type VARCHAR(50) DEFAULT 'VIEW'"))
            await session.commit()
            print('Added action_type to material_activities')
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
