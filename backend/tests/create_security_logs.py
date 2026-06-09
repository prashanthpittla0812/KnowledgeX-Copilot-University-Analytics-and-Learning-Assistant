import asyncio
from app.database.db import engine, Base
from app.database.models import SecurityLog

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(run())
