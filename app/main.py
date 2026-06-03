from fastapi import FastAPI

from app.routes.document_routes import (
    router as document_router
)

from app.routes.quiz_routes import (
    router as quiz_router
)

app = FastAPI()

app.include_router(document_router)

app.include_router(quiz_router)