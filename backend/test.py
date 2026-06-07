import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.database.models import LearningMaterial
import traceback

async def main():
    engine = create_async_engine('mysql+aiomysql://root:139202021%40Mittu@localhost:3306/knowledgex')
    try:
        async with AsyncSession(engine) as session:
            new_mat = LearningMaterial(
                faculty_id=2,
                title='Networking Notes',
                material_type='NOTE',
                description='afkjdbgkh',
                subject='computer networks',
                topic='tcp',
                department='cse',
                semester=5,
                file_path='a',
                file_url='b',
                file_size_bytes=100
            )
            session.add(new_mat)
            await session.commit()
            print('Inserted!')
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
