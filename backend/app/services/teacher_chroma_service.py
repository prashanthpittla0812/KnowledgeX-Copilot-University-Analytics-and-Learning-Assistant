from langchain_chroma import Chroma
from langchain_openai import AzureOpenAIEmbeddings, OpenAIEmbeddings

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger()


from app.utils.embeddings import get_embeddings


def get_teacher_embeddings():
    return get_embeddings()


def save_to_chroma(topic_name: str, chunks: list) -> Chroma:
    topic_name = topic_name.lower().strip()
    db_path = str(settings.CHROMA_PATH / topic_name)
    embedding_function = get_teacher_embeddings()
    if embedding_function is None:
        logger.warning(f"Could not save to ChromaDB for topic {topic_name}: Embeddings failed to load")
        return None

    db = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        persist_directory=db_path,
    )
    logger.info(f"Saved to ChromaDB: {db_path}")
    return db


def get_vectorstore(topic_name: str) -> Chroma:
    topic_name = topic_name.lower().strip()
    db_path = str(settings.CHROMA_PATH / topic_name)
    embedding_function = get_teacher_embeddings()
    if embedding_function is None:
        raise ValueError("Embeddings could not be loaded")
    
    db = Chroma(
        persist_directory=db_path,
        embedding_function=embedding_function,
    )
    return db


def retrieve_context(topic_name: str, query: str, k: int = 5) -> str:
    try:
        db = get_vectorstore(topic_name)
        retriever = db.as_retriever(search_kwargs={"k": k})
        docs = retriever.invoke(query)
        logger.info(f"RAG documents found: {len(docs)} for topic '{topic_name}'")
        if not docs:
            return ""
        return "\n\n".join(doc.page_content for doc in docs)
    except Exception as e:
        logger.warning(f"RAG retrieval error for topic '{topic_name}': {e}")
        return ""
