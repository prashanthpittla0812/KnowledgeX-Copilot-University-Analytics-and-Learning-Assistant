import asyncio
import sys
from pathlib import Path
import logging

# Add the parent directory to sys.path so we can import from app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import select
from app.database.db import AsyncSessionLocal
from app.database.models import User
from app.services.supabase_storage import SupabaseStorageService
from app.config.settings import settings
import uuid
import aiofiles
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_existing_profile_photos():
    logger.info("Starting profile photo migration to Supabase Storage...")
    
    async with AsyncSessionLocal() as session:
        # Get users with local profile photos
        query = select(User).where(User.profile_photo_path.like("uploads/%"))
        result = await session.execute(query)
        users = result.scalars().all()
        
        if not users:
            logger.info("No local profile photos found to migrate.")
            return

        logger.info(f"Found {len(users)} users with local profile photos. Beginning migration...")
        
        success_count = 0
        failure_count = 0
        
        for user in users:
            try:
                local_path = settings.UPLOAD_PATH.parent / user.profile_photo_path
                if not local_path.exists():
                    logger.warning(f"File not found for user {user.id}: {local_path}. Skipping.")
                    failure_count += 1
                    continue
                
                # Determine content type based on extension
                ext = local_path.suffix.lower()
                content_type = "image/jpeg"
                if ext == ".png":
                    content_type = "image/png"
                elif ext == ".webp":
                    content_type = "image/webp"
                
                # Read file bytes
                async with aiofiles.open(local_path, "rb") as f:
                    file_bytes = await f.read()
                
                # Generate unique filename for Supabase
                unique_filename = f"user_{user.id}_{uuid.uuid4().hex}{ext or '.jpg'}"
                
                # Upload to Supabase
                public_url = await SupabaseStorageService.upload_file(file_bytes, unique_filename, content_type)
                
                if public_url:
                    user.profile_photo_path = public_url
                    success_count += 1
                    logger.info(f"Successfully migrated photo for user {user.id}: {public_url}")
                else:
                    logger.error(f"Failed to upload photo for user {user.id} to Supabase.")
                    failure_count += 1
                    
            except Exception as e:
                logger.error(f"Error migrating photo for user {user.id}: {e}")
                failure_count += 1
                
        # Commit the database changes
        await session.commit()
        
    logger.info(f"Migration complete. Success: {success_count}, Failures: {failure_count}.")

if __name__ == "__main__":
    asyncio.run(migrate_existing_profile_photos())
