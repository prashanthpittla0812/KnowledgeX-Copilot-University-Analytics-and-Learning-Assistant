from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import User

async def update_user_streak(user: User, db: AsyncSession) -> None:
    now = datetime.utcnow()
    updated = False
    
    if not user.last_login_date:
        user.current_streak = 1
        user.last_login_date = now
        updated = True
    elif user.current_streak == 0:
        user.current_streak = 1
        user.last_login_date = now
        updated = True
    else:
        delta = now.date() - user.last_login_date.date()
        if delta.days == 1:
            user.current_streak += 1
            user.last_login_date = now
            updated = True
        elif delta.days > 1:
            user.current_streak = 1
            user.last_login_date = now
            updated = True
            
    if updated:
        await db.commit()
