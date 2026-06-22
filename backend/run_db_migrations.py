import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.config.settings import settings
from app.database.models import Base

async def update_db():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Creating new tables (EmailVerificationOTP)...")
        await conn.run_sync(Base.metadata.create_all)
        
        print("Altering users table to add email_verified...")
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL;"))
        except Exception as e:
            print(f"Alter email_verified failed (might already exist): {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;"))
        except Exception as e:
            print(f"Alter verified_at failed (might already exist): {e}")
            
        print("Updating existing users so they are not locked out...")
        await conn.execute(text("UPDATE users SET email_verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE email_verified = FALSE;"))
        
    await engine.dispose()
    print("Database update complete.")

if __name__ == "__main__":
    asyncio.run(update_db())
