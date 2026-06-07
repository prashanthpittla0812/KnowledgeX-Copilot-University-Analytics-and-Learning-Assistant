import asyncio
import aiohttp
import sys

async def main():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post('http://localhost:8000/api/v1/auth/login', json={'email': 'faculty1@knowledgex.com', 'password': 'Password@123'}) as r:
                res = await r.json()
                if 'access_token' not in res:
                    print('Login failed:', res)
                    return
                token = res['access_token']
                
            headers = {'Authorization': 'Bearer ' + token}
            form = aiohttp.FormData()
            form.add_field('title', 'Networking Notes')
            form.add_field('material_type', 'NOTE')
            form.add_field('description', 'afkjdbgkh')
            form.add_field('subject', 'computer networks')
            form.add_field('topic', 'tcp')
            form.add_field('department', 'cse')
            form.add_field('semester', '5')
            form.add_field('file', b'file content', filename='AI_ML_5_Page_Notes.pdf', content_type='application/pdf')

            async with session.post('http://localhost:8000/api/v1/materials/faculty', headers=headers, data=form) as r:
                print(r.status, await r.text())
    except Exception as e:
        print(e)

if __name__ == "__main__":
    asyncio.run(main())
