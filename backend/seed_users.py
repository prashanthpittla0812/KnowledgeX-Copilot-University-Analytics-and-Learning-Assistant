from __future__ import annotations

from seed_utils import first_existing, get_session, hash_password, reflect_table, update_or_insert_by_unique


DEFAULT_PASSWORD = "Password@123"

USERS = [
    {"email": "admin@knowledgex.com", "name": "KnowledgeX Admin", "role": "admin"},
    {"email": "faculty1@knowledgex.com", "name": "Faculty One", "role": "faculty"},
    {"email": "faculty2@knowledgex.com", "name": "Faculty Two", "role": "faculty"},
    {"email": "student1@knowledgex.com", "name": "Student One", "role": "student"},
    {"email": "student2@knowledgex.com", "name": "Student Two", "role": "student"},
    {"email": "student3@knowledgex.com", "name": "Student Three", "role": "student"},
]


def main() -> None:
    session = get_session()
    try:
        users_table = reflect_table(session.bind, ["users", "user"])
        email_col = first_existing(users_table, ["email", "email_id"])
        password_col = first_existing(users_table, ["hashed_password", "password_hash", "password"])
        role_col = first_existing(users_table, ["role", "user_role", "account_type"])
        name_col = first_existing(users_table, ["name", "full_name", "username"])
        active_col = first_existing(users_table, ["is_active", "active"])

        if not email_col or not password_col:
            raise RuntimeError("Users table must include an email column and a password hash column.")

        hashed = hash_password(DEFAULT_PASSWORD)
        for user in USERS:
            values = {
                email_col: user["email"],
                password_col: hashed,
            }
            if role_col:
                values[role_col] = user["role"]
            if name_col:
                values[name_col] = user["name"]
            if active_col:
                values[active_col] = True
            update_or_insert_by_unique(session, users_table, email_col, user["email"], values)

        session.commit()
        print(f"Seeded {len(USERS)} users. Default password: {DEFAULT_PASSWORD}")
    finally:
        session.close()


if __name__ == "__main__":
    main()

