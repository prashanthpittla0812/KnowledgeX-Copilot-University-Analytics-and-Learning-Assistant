import asyncio
from sqlalchemy import text
from app.database.db import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;"))
            await conn.execute(text("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES teacher_quizzes(id) ON DELETE CASCADE;"))
            await conn.execute(text("ALTER TABLE student_answers DROP CONSTRAINT IF EXISTS student_answers_question_id_fkey;"))
            await conn.execute(text("ALTER TABLE student_answers ADD CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES teacher_quiz_questions(id) ON DELETE CASCADE;"))
            print("Successfully updated foreign keys!")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
