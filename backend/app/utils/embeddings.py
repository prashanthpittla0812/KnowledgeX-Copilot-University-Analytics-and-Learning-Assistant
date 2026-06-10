from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_openai import AzureOpenAIEmbeddings, OpenAIEmbeddings

from app.config.settings import settings


def get_embeddings():
    if settings.AI_PROVIDER == "openai":
        return OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=settings.OPENAI_API_KEY,
        )
    elif settings.AI_PROVIDER == "azure":
        return AzureOpenAIEmbeddings(
            model="text-embedding-ada-002",
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
        )
    else:
        return OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=settings.OLLAMA_BASE_URL,
        )


def get_vector_store(collection_name: str = "documents"):
    embeddings = get_embeddings()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(settings.CHROMA_PATH),
    )
