import asyncio
from app.database.db import engine
from sqlalchemy import text

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(text("SHOW TABLES LIKE 'security_logs'"))
        print("Table exists:", res.fetchone() is not None)

asyncio.run(run())
