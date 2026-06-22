import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.database.models import TeacherQuiz, TeacherQuizQuestion

engine = create_async_engine("sqlite+aiosqlite:///./knowledgeX.db")
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TeacherQuiz))
        quizzes = result.scalars().all()
        for q in quizzes:
            print(f"Quiz {q.id}: {q.topic_name}")
            
            res = await db.execute(select(TeacherQuizQuestion).where(TeacherQuizQuestion.quiz_id == q.id))
            questions = res.scalars().all()
            print(f"  -> Questions: {len(questions)}")

if __name__ == "__main__":
    asyncio.run(check_db())
