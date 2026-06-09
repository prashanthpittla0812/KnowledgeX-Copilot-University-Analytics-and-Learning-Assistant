import asyncio
from sqlalchemy import text
from app.database.db import engine

async def test_connection():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.scalar()
            if row == 1:
                print("Successfully connected to Supabase PostgreSQL!")
            else:
                print("Connected but got unexpected result:", row)
    except Exception as e:
        print("Failed to connect to the database:", e)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
