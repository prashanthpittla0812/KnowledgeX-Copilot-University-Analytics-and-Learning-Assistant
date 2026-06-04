from langchain_chroma import Chroma

from langchain_ollama import OllamaEmbeddings

import os


CHROMA_PATH = "chroma_db"


def get_embedding_function():

    return OllamaEmbeddings(
        model="nomic-embed-text"
    )


def save_to_chroma(
        topic_name,
        chunks
):

    topic_name = topic_name.lower().strip()

    db_path = os.path.join(
        CHROMA_PATH,
        topic_name
    )

    embedding_function = get_embedding_function()

    db = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        persist_directory=db_path
    )

    print(f"\nSaved to ChromaDB: {db_path}")

    return db


def get_vectorstore(
        topic_name
):

    topic_name = topic_name.lower().strip()

    db_path = os.path.join(
        CHROMA_PATH,
        topic_name
    )

    print(f"\nLoading ChromaDB: {db_path}")

    embedding_function = get_embedding_function()

    db = Chroma(
        persist_directory=db_path,
        embedding_function=embedding_function
    )

    return db


def retrieve_context(
        topic_name,
        query
):

    try:

        print("\n==========================")
        print("RAG RETRIEVAL STARTED")
        print("==========================")

        db = get_vectorstore(
            topic_name
        )

        retriever = db.as_retriever(
            search_kwargs={
                "k": 5
            }
        )

        docs = retriever.invoke(
            query
        )

        print(
            f"Documents Found: {len(docs)}"
        )

        if not docs:

            return ""

        context = "\n\n".join(
            [
                doc.page_content
                for doc in docs
            ]
        )

        print("\n========== CONTEXT ==========")
        print(context[:1000])

        return context

    except Exception as e:

        print("\nRAG ERROR")
        print(str(e))

        return ""