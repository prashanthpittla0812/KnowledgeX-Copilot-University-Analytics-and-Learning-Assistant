from __future__ import annotations

from seed_utils import deterministic_embedding, first_existing, get_session, insert_dynamic, reflect_table, row_by_column


DOCUMENTS = [
    {
        "title": "AI Notes",
        "topic": "Artificial Intelligence",
        "content": "Artificial Intelligence covers agents, search, knowledge representation, reasoning, planning, and responsible AI systems.",
    },
    {
        "title": "Machine Learning Notes",
        "topic": "Machine Learning",
        "content": "Machine Learning includes supervised learning, regression, classification, clustering, evaluation metrics, and model validation.",
    },
    {
        "title": "Data Science Notes",
        "topic": "Data Science",
        "content": "Data Science combines data cleaning, exploration, statistics, visualization, feature engineering, and predictive modeling.",
    },
]


def seed_chroma() -> None:
    try:
        import chromadb
    except Exception:
        print("chromadb is not installed; skipped ChromaDB document seeding.")
        return

    client = chromadb.PersistentClient(path="chroma_db")
    collection = client.get_or_create_collection("knowledgex_documents")
    collection.upsert(
        ids=[doc["title"].lower().replace(" ", "-") for doc in DOCUMENTS],
        documents=[doc["content"] for doc in DOCUMENTS],
        embeddings=[deterministic_embedding(doc["content"]) for doc in DOCUMENTS],
        metadatas=[{"title": doc["title"], "topic": doc["topic"]} for doc in DOCUMENTS],
    )
    print("Seeded ChromaDB collection: knowledgex_documents")


def main() -> None:
    session = get_session()
    try:
        documents_table = reflect_table(session.bind, ["documents", "document", "uploaded_documents"])
        title_col = first_existing(documents_table, ["title", "name", "document_name", "file_name"])
        content_col = first_existing(documents_table, ["content", "text", "description", "summary"])
        topic_col = first_existing(documents_table, ["topic", "topic_name", "subject"])
        path_col = first_existing(documents_table, ["file_path", "path", "source"])
        type_col = first_existing(documents_table, ["document_type", "file_type", "type"])
        date_col = first_existing(documents_table, ["upload_date", "uploaded_at", "created_at"])

        if not title_col:
            raise RuntimeError("Documents table must include a title/name column.")

        user_id_col = first_existing(documents_table, ["user_id", "teacher_id", "faculty_id", "uploaded_by"])
        admin_user = None
        if user_id_col:
            users_table = reflect_table(session.bind, ["users", "user"])
            email_col = first_existing(users_table, ["email"])
            admin_user = row_by_column(session, users_table, email_col, "admin@knowledgex.com")
            if not admin_user:
                admin_user = row_by_column(session, users_table, email_col, "faculty1@knowledgex.com")

        for doc in DOCUMENTS:
            if row_by_column(session, documents_table, title_col, doc["title"]):
                continue
            values = {title_col: doc["title"]}
            if user_id_col and admin_user:
                user_id_val = admin_user.get("id") or admin_user.get("user_id")
                if user_id_val:
                    values[user_id_col] = user_id_val
            if content_col:
                values[content_col] = doc["content"]
            if topic_col:
                values[topic_col] = doc["topic"]
            if path_col:
                values[path_col] = f"seed://{doc['title'].lower().replace(' ', '-')}"
            if type_col:
                values[type_col] = "seed"
            if date_col:
                from datetime import datetime
                values[date_col] = datetime.utcnow()
            insert_dynamic(session, documents_table, values)

        session.commit()
        print(f"Seeded {len(DOCUMENTS)} sample documents.")
    finally:
        session.close()

    seed_chroma()


if __name__ == "__main__":
    main()

