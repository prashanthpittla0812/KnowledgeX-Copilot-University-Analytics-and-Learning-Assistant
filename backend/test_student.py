import asyncio
import aiohttp

async def main():
    try:
        async with aiohttp.ClientSession() as session:
            # Login as student
            async with session.post('http://localhost:8000/api/v1/auth/login', json={'email': 'admin@knowledgex.com', 'password': 'Password@123'}) as r:
                res = await r.json()
                if 'access_token' not in res:
                    print('Login failed:', res)
                    return
                token = res['access_token']
                
            headers = {'Authorization': 'Bearer ' + token}
            async with session.get('http://localhost:8000/api/v1/materials/student', headers=headers) as r:
                text = await r.text()
                print("Status:", r.status)
                print("Response:", text[:500])
    except Exception as e:
        print(e)

if __name__ == "__main__":
    asyncio.run(main())
