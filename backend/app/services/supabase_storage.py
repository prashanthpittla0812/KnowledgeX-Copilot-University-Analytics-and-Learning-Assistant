import logging
from typing import Optional
from supabase import create_client, Client
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize the Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class SupabaseStorageService:
    @staticmethod
    def get_public_url(filename: str) -> str:
        """Get the public URL for a given file in the configured bucket."""
        try:
            res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(filename)
            return res
        except Exception as e:
            logger.error(f"Failed to get public URL for {filename}: {e}")
            return ""

    @staticmethod
    async def upload_file(file_bytes: bytes, filename: str, content_type: str) -> Optional[str]:
        """Upload a file to Supabase Storage and return its public URL."""
        try:
            # Upload file
            res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": content_type}
            )
            # Retrieve the public URL
            return SupabaseStorageService.get_public_url(filename)
        except Exception as e:
            logger.error(f"Error uploading file {filename} to Supabase: {e}")
            return None

    @staticmethod
    async def delete_file(filename: str) -> bool:
        """Delete a file from Supabase Storage."""
        try:
            res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([filename])
            return True
        except Exception as e:
            logger.error(f"Error deleting file {filename} from Supabase: {e}")
            return False
