import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient() as client:
        # Let's login as Test Faculty
        login_data = {"username": "Test Faculty", "password": "password", "role": "faculty"}
        resp = await client.post("http://localhost:8000/api/v1/auth/login", json=login_data)
        if resp.status_code != 200:
            print("Login failed:", resp.status_code, resp.text)
            return
        
        token = resp.json()["access_token"]
        
        # Now fetch the quizzes
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get("http://localhost:8000/api/v1/dashboard/teacher/quizzes", headers=headers)
        print("Status:", resp.status_code)
        print("Response:", resp.json())

asyncio.run(main())
