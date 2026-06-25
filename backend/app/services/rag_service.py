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
        self.llm = self._init_llm()

    def _get_vector_store(self):
        return get_vector_store()

    def _init_llm(self):
        if settings.AI_PROVIDER == "openai":
            return init_chat_model(
                settings.OPENAI_MODEL,
                model_provider="openai",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
                max_tokens=1024,
            )
        elif settings.AI_PROVIDER == "azure":
            return init_chat_model(
                settings.AZURE_OPENAI_DEPLOYMENT,
                model_provider="azure_openai",
                api_key=settings.AZURE_OPENAI_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.3,
                max_tokens=1024,
            )
        elif settings.AI_PROVIDER == "groq":
            logger.info("Using Groq LLM")
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                max_tokens=1024,
            )
        else:
            logger.info("Using Groq LLM as default fallback")
            return init_chat_model(
                settings.GROQ_MODEL,
                model_provider="groq",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                max_tokens=1024,
            )

    def load_and_index_pdf(self, file_path: str) -> int:
        text = extract_text_from_pdf(file_path)
        chunks = split_text(text)
        return self.index_chunks(chunks)

    def index_chunks(self, chunks: list[str]) -> int:
        texts = [chunk for chunk in chunks if chunk.strip()]
        if texts:
            vs = self._get_vector_store()
            if vs:
                vs.add_texts(texts)
                logger.info(f"Indexed {len(texts)} chunks into vector store")
            else:
                logger.warning("Vector store unavailable. Chunks not indexed.")
        return len(texts)

    def retrieve_context(self, query: str, k: int = 3) -> list[str]:
        vs = self._get_vector_store()
        if not vs:
            return []
        docs = vs.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

    def generate_answer(self, question: str, content_ids: list[int] = None) -> dict:
        prompt = PromptTemplate(
            template=RAG_QA_PROMPT_TEMPLATE,
            input_variables=["context", "question"],
        )

        filter_dict = None
        if content_ids:
            if len(content_ids) == 1:
                filter_dict = {"content_id": content_ids[0]}
            else:
                filter_dict = {"content_id": {"$in": content_ids}}

        vs = self._get_vector_store()
        
        if vs is None:
            logger.info("Using direct Groq chat fallback")
            # Fallback to direct LLM response
            direct_prompt = PromptTemplate(
                template="You are a helpful academic assistant. Please answer the following question: {question}",
                input_variables=["question"]
            )
            chain = direct_prompt | self.llm
            result = chain.invoke({"question": question})
            return {
                "answer": result.content,
                "sources": [],
            }

        docs = vs.similarity_search(question, k=3, filter=filter_dict)
        context = "\n\n".join(doc.page_content for doc in docs)

        chain = prompt | self.llm
        result = chain.invoke({"context": context, "question": question})

        sources_metadata = []
        for doc in docs:
            # Look for Timestamp in content or use metadata
            meta = doc.metadata
            source_info = {
                "source": meta.get("source", "unknown"),
                "source_type": meta.get("source_type", "PDF"),
                "timestamp_or_page": "Not specified"
            }
            # Heuristic to extract timestamp from video OCR text if present
            if "[Timestamp" in doc.page_content:
                parts = doc.page_content.split("[Timestamp")
                if len(parts) > 1:
                    ts = parts[1].split("]")[0].strip()
                    source_info["timestamp_or_page"] = f"Timestamp {ts}"
            
            sources_metadata.append(source_info)

        return {
            "answer": result.content,
            "sources": sources_metadata,
        }

    def summarize_content(self, text: str, summary_type: str = "Short Summary") -> str:
        if not text:
            return "No content provided to summarize."
            
        prompts = {
            "Short Summary": "Provide a brief 3-sentence summary of the following content:\n\n{text}",
            "Detailed Summary": "Provide a detailed summary covering all main points of the following content:\n\n{text}",
            "Exam Notes": "Convert the following content into concise bullet points suitable for exam preparation:\n\n{text}",
            "Revision Notes": "Extract the key concepts and explain them briefly for revision:\n\n{text}",
            "Key Concepts": "List ONLY the top 5 key concepts mentioned in this text with a 1-sentence explanation for each:\n\n{text}"
        }
        
        prompt_template = prompts.get(summary_type, prompts["Short Summary"])
        
        from langchain_core.prompts import PromptTemplate
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["text"]
        )
        
        chain = prompt | self.llm
        result = chain.invoke({"text": text[:15000]}) # Limit text to avoid token limits
        
        return result.content

