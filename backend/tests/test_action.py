from app.config.settings import settings
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, func
from app.database.models import LearningMaterial, MaterialActivity
from app.schemas.material_schema import MaterialResponse
import traceback

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    try:
        async with AsyncSession(engine) as db:
            faculty_id = 9
            query = select(LearningMaterial).where(LearningMaterial.faculty_id == faculty_id)
            result = await db.execute(query)
            materials = result.scalars().all()
            
            response_list = []
            for m in materials:
                views_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id == m.id, MaterialActivity.action_type == 'VIEW'))
                views = views_res.scalar() or 0
                
                down_res = await db.execute(select(func.count()).select_from(MaterialActivity).where(MaterialActivity.material_id == m.id, MaterialActivity.action_type == 'DOWNLOAD'))
                downloads = down_res.scalar() or 0
                
                m_dict = {
                    **m.__dict__,
                    "views_count": views,
                    "downloads_count": downloads
                }
                response_list.append(m_dict)
            
            # Test schema validation
            for data in response_list:
                MaterialResponse(**data)
                
            print("Success!")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
