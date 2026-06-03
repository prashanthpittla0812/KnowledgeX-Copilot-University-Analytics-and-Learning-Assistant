from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader

try:
    from langchain_community.document_loaders import UnstructuredPDFLoader
    HAS_UNSTRUCTURED = True
except ImportError:
    HAS_UNSTRUCTURED = False


def load_pdf_pypdf(file_path: str | Path) -> str:
    loader = PyPDFLoader(str(file_path))
    documents = loader.load()
    return "\n".join(doc.page_content for doc in documents)


def load_pdf_unstructured(file_path: str | Path) -> str:
    if not HAS_UNSTRUCTURED:
        raise ImportError("unstructured[pdf] is not installed. Run: pip install unstructured[pdf]")
    loader = UnstructuredPDFLoader(str(file_path))
    documents = loader.load()
    return "\n".join(doc.page_content for doc in documents)


def extract_text_from_pdf(file_path: str | Path, method: str = "pypdf") -> str:
    if method == "unstructured":
        return load_pdf_unstructured(file_path)
    return load_pdf_pypdf(file_path)
