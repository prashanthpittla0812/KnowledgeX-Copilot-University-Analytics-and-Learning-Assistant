from langchain_chroma import Chroma
from langchain_openai import AzureOpenAIEmbeddings, OpenAIEmbeddings
from functools import lru_cache

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger()

@lru_cache(maxsize=1)
def get_embeddings():
    # If provider is openai or groq (but using openai standard model as a paid bridge)
    if settings.AI_PROVIDER == "openai":
        return OpenAIEmbeddings(
            model="text-embedding-3-small", # Or "text-embedding-ada-002"
            api_key=settings.OPENAI_API_KEY,
        )
    elif settings.AI_PROVIDER == "azure":
        return AzureOpenAIEmbeddings(
            model="text-embedding-ada-002",
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
        )
    elif settings.AI_PROVIDER == "groq":
        # Since Groq handles LLMs but not embeddings, we use a high-quality free cloud alternative 
        # so you don't run into a crashing endpoint.
        from langchain_huggingface import HuggingFaceEmbeddings
        logger.info("Using HuggingFace embeddings")
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    else:
        # Defaulting to HuggingFace cloud embeddings
        from langchain_huggingface import HuggingFaceEmbeddings
        logger.info("Using HuggingFace embeddings (fallback)")
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )


def get_vector_store(collection_name: str = "documents"):
    embeddings = get_embeddings()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(settings.CHROMA_PATH),
    )