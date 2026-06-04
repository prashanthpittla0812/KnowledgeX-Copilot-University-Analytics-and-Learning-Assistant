from fastapi import FastAPI

from app.routes.teacher_routes import (
    router as teacher_router
)

from app.routes.teacher_quiz_routes import (
    router as teacher_quiz_router
)
from app.routes.student_quiz_routes import (
    router as student_quiz_router
)

from app.routes.teacher_document_routes import (
    router as teacher_document_router
)
from app.routes.student_submit_routes import (
    router as student_submit_router
)
from app.routes.teacher_result_routes import (
    router as teacher_result_router
)

app = FastAPI(
    title="KnowledgeX Teacher Module",
    version="1.0.0"
)

app.include_router(
    teacher_router
)

app.include_router(
    teacher_quiz_router
)


@app.get("/")
def home():

    return {
        "message": "KnowledgeX Teacher Module Running"
    }
    
app.include_router(
    teacher_document_router
)

app.include_router(
    student_quiz_router
)

app.include_router(
    student_submit_router
)


app.include_router(
    teacher_result_router
)