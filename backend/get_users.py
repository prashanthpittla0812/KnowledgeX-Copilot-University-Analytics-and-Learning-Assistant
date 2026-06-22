import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.buyuodcwmfjilxvzhabp:KumudhaAkshaya@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

async def run():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT id, name, email, department, designation FROM users WHERE name = 'student'"))
        rows = result.fetchall()
        for r in rows:
            print(dict(r._mapping))

if __name__ == "__main__":
    asyncio.run(run())
