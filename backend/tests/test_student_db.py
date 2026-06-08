import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, desc
from app.database.models import LearningMaterial, User, MaterialBookmark
from app.schemas.material_schema import MaterialResponse
import traceback

async def main():
    engine = create_async_engine('mysql+aiomysql://root:139202021%40Mittu@localhost:3306/knowledgex')
    try:
        async with AsyncSession(engine) as db:
            current_user_id = 1
            query = select(LearningMaterial, User.name.label("faculty_name"))\
                .join(User, LearningMaterial.faculty_id == User.id)\
                .where(LearningMaterial.is_active == True)\
                .order_by(desc(LearningMaterial.created_at))
                
            result = await db.execute(query)
            rows = result.all()
            
            response_list = []
            for mat, faculty_name in rows:
                bm_res = await db.execute(select(MaterialBookmark).where(MaterialBookmark.material_id == mat.id, MaterialBookmark.student_id == current_user_id, MaterialBookmark.is_active == True))
                bm = bm_res.scalar_one_or_none()
                
                m_dict = {
                    **mat.__dict__,
                    "faculty_name": faculty_name,
                    "is_bookmarked": bm is not None
                }
                response_list.append(m_dict)
                
            print("DB Fetch successful!")
            
            for r in response_list:
                try:
                    obj = MaterialResponse.model_validate(r)
                except Exception as e:
                    print("Validation error for material", r.get('id'))
                    print(e)
                    
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
