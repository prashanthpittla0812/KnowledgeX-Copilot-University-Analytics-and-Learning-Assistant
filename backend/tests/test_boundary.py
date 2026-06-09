import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:8000/api/v1/auth/login', data={'username': 'faculty1@knowledgex.com', 'password': 'Password@123'}) as r:
            token = (await r.json())['access_token']
        headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data'}
        async with session.post('http://localhost:8000/api/v1/materials/faculty', headers=headers, data=b'some data') as r:
            print(r.status, await r.text())

if __name__ == "__main__":
    asyncio.run(main())
