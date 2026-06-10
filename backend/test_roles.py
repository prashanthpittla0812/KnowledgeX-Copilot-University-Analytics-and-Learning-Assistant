import asyncio
from app.database.db import AsyncSessionLocal
from app.database.models import User
from sqlalchemy import select
from app.auth.jwt_handler import create_access_token
import urllib.request

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User))
        users = res.scalars().all()
        for u in users:
            if u.role.lower() == 'student':
                token = create_access_token({"user_id": u.id, "role": u.role})
                req = urllib.request.Request('http://127.0.0.1:8000/api/v1/materials/student', headers={'Authorization': 'Bearer ' + token})
                try:
                    resp = urllib.request.urlopen(req)
                    print("Student request success:", resp.status)
                except Exception as e:
                    print("Student request failed:", e)
                break

asyncio.run(main())
