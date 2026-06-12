import asyncio
import json
from sqlalchemy import select
from app.database.db import AsyncSessionLocal
from app.database.models import StudyPlan

async def get_latest_plan():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(StudyPlan).order_by(StudyPlan.created_at.desc()).limit(1)
        )
        plan = result.scalars().first()
        if plan:
            print("Latest Plan ID:", plan.id)
            print("Created At:", plan.created_at)
            parsed_content = json.loads(plan.plan_content)
            print(json.dumps(parsed_content, indent=2))
        else:
            print("No study plan found in the database.")

if __name__ == "__main__":
    asyncio.run(get_latest_plan())
