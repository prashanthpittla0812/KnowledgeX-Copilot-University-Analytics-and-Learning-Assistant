from app.services.document_service import process_document


class TeacherDocumentService:

    def upload_document(
        self,
        file_path,
        topic_name
    ):

        process_document(
            file_path=file_path,
            topic_name=topic_name
        )

        return {
            "status": "success",
            "message": "Teacher document uploaded successfully"
        }


teacher_document_service = TeacherDocumentService()