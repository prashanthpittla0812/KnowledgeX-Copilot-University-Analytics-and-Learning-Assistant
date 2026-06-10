import asyncio, httpx
from app.auth.jwt_handler import create_access_token
import asyncpg
from app.config.settings import settings

async def test():
    url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url)
    row = await conn.fetchrow("SELECT id, email, role FROM users WHERE role = 'student' LIMIT 1")
    await conn.close()
    
    if not row:
        print('No student users in DB!')
        return

    print(f'Using user: {dict(row)}')
    token = create_access_token({'sub': row['email'], 'role': row['role'], 'user_id': row['id']})
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        with open('dummy.mp3', 'rb') as f:
            files = {'files': ('dummy.mp3', f, 'audio/mpeg')}
            data = {'asr_provider': 'Whisper'}
            headers = {'Authorization': f'Bearer {token}'}
            res_upload = await client.post('http://localhost:8000/api/v1/documents/multimodal/upload-batch', files=files, data=data, headers=headers)
            print('Upload status:', res_upload.status_code)
            print('Upload response:', res_upload.text)

asyncio.run(test())
