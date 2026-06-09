from app.database.db import SessionLocal

try:
    db = SessionLocal()
    print("Connected Successfully")
    db.close()

except Exception as e:
    print(e)