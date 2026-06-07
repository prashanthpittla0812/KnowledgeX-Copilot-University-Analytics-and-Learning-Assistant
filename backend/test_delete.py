import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.database.models import LearningMaterial

async def main():
    engine = create_async_engine('mysql+aiomysql://root:139202021%40Mittu@localhost:3306/knowledgex')
    try:
        async with AsyncSession(engine) as db:
            result = await db.execute(select(LearningMaterial).where(LearningMaterial.id == 12))
            material = result.scalar_one_or_none()
            if material:
                await db.delete(material)
                await db.commit()
                print("Deleted!")
            else:
                print("Not found")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
