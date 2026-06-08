import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, func
from app.database.models import LearningMaterial, MaterialActivity
import traceback

async def main():
    engine = create_async_engine('mysql+aiomysql://root:139202021%40Mittu@localhost:3306/knowledgex')
    try:
        async with AsyncSession(engine) as db:
            materials_res = await db.execute(select(LearningMaterial.id).where(LearningMaterial.faculty_id == 9))
            m_ids = [row for row in materials_res.scalars().all()]
            print('m_ids:', m_ids)
            
            if m_ids:
                views_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id.in_(m_ids), MaterialActivity.action_type == 'VIEW'))
                print('views:', views_res.scalar())
                
                down_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id.in_(m_ids), MaterialActivity.action_type == 'DOWNLOAD'))
                print('downs:', down_res.scalar())
                
                all_res = await db.execute(select(MaterialActivity.action_type).where(MaterialActivity.material_id.in_(m_ids)))
                print('all action types:', all_res.scalars().all())
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
