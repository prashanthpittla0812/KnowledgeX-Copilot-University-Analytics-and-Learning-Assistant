from langchain.chains import RetrievalQA
from langchain.chat_models import init_chat_model
from langchain_core.prompts import PromptTemplate

from app.config.prompts import RAG_QA_PROMPT_TEMPLATE
from app.config.settings import settings
from app.utils.chunking import split_text
from app.utils.embeddings import get_embeddings, get_vector_store
from app.utils.logger import get_logger
from app.utils.pdf_loader import extract_text_from_pdf

logger = get_logger()


class RAGService:
    def __init__(self):
        self.embeddings = get_embeddings()
        self.vector_store = get_vector_store()
        self.llm = self._init_llm()

    def _init_llm(self):
        if settings.AI_PROVIDER == "openai":
            return init_chat_model(
                settings.OPENAI_MODEL,
                model_provider="openai",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
        elif settings.AI_PROVIDER == "azure":
            return init_chat_model(
                settings.AZURE_OPENAI_DEPLOYMENT,
                model_provider="azure_openai",
                api_key=settings.AZURE_OPENAI_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.3,
            )
        else:
            return init_chat_model(
                settings.OLLAMA_MODEL,
                model_provider="ollama",
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.3,
            )

    def load_and_index_pdf(self, file_path: str) -> int:
        text = extract_text_from_pdf(file_path)
        chunks = split_text(text)
        return self.index_chunks(chunks)

    def index_chunks(self, chunks: list[str]) -> int:
        texts = [chunk for chunk in chunks if chunk.strip()]
        if texts:
            self.vector_store.add_texts(texts)
            logger.info(f"Indexed {len(texts)} chunks into vector store")
        return len(texts)

    def retrieve_context(self, query: str, k: int = 4) -> list[str]:
        docs = self.vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

    def generate_answer(self, question: str) -> dict:
        prompt = PromptTemplate(
            template=RAG_QA_PROMPT_TEMPLATE,
            input_variables=["context", "question"],
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(search_kwargs={"k": 4}),
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True,
        )

        result = qa_chain.invoke({"query": question})

        return {
            "answer": result["result"],
            "sources": [
                doc.metadata.get("source", "unknown")
                for doc in result.get("source_documents", [])
            ],
        }
