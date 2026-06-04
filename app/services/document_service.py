from app.utils.pdf_loader import (
    load_pdf
)

from app.utils.chunking import (
    split_documents
)

from app.services.rag_service import (
    save_to_chroma
)


def process_document(
        file_path,
        topic_name
):

    documents = load_pdf(
        file_path
    )

    chunks = split_documents(
        documents
    )

    save_to_chroma(
        topic_name,
        chunks
    )

    return True