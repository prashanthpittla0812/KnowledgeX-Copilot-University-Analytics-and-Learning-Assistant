import asyncio
from app.database.db import SessionLocal
from app.database.models import ProcessedContent
from sqlalchemy import select

async def run():
    async with SessionLocal() as db:
        res = await db.execute(select(ProcessedContent).order_by(ProcessedContent.id.desc()).limit(1))
        doc = res.scalar_one_or_none()
        print('OCR Text Length:', len(doc.ocr_text) if doc and doc.ocr_text else 0)
        print('Text sample:', doc.ocr_text[:200] if doc and doc.ocr_text else 'None')

asyncio.run(run())
