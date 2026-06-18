import sqlite3

conn = sqlite3.connect('knowledgex.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", c.fetchall())

try:
    c.execute("SELECT email, role FROM users")
    print("Users in users table:", c.fetchall())
except Exception as e:
    print(e)
