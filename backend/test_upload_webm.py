import asyncio
import os
import sys

# Add backend to path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.services.supabase_storage import SupabaseStorageService
from dotenv import load_dotenv

load_dotenv()

async def run():
    print("Testing upload...")
    url = await SupabaseStorageService.upload_file(b'test data for video', 'test_video.webm', 'video/webm')
    print("URL:", url)

asyncio.run(run())
