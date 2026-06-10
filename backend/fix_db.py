import pymysql
import os
from urllib.parse import urlparse

# DATABASE_URL=mysql+pymysql://root:akshaya@localhost:3306/knowledgex

connection = pymysql.connect(
    host='localhost',
    user='root',
    password='akshaya',
    database='knowledgex',
    port=3306
)

try:
    with connection.cursor() as cursor:
        try:
            print("Renaming student_id to user_id...")
            cursor.execute("ALTER TABLE material_bookmarks CHANGE student_id user_id INT NOT NULL;")
        except Exception as e:
            print(f"Error (maybe already renamed): {e}")
            
        try:
            print("Adding timestamp column...")
            cursor.execute("ALTER TABLE material_bookmarks ADD COLUMN timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL;")
        except Exception as e:
            print(f"Error (maybe already added): {e}")

    connection.commit()
    print("Database updated successfully.")
finally:
    connection.close()
