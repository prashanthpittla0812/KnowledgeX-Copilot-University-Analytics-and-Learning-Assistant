from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.settings import settings
from app.database.db import close_db, init_db
from app.routes import (
    assessment_routes,
    attendance_routes,
    auth_routes,
    chatbot_routes,
    dashboard_routes,
    document_routes,
    quiz_routes,
    recommendation_routes,
    role_routes,
    student_routes,
    studyplan_routes,
)
from app.utils.constants import APP_DESCRIPTION, APP_NAME, APP_VERSION
from app.utils.logger import get_logger, setup_logger

logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logger()
    logger.info(f"Starting {APP_NAME} v{APP_VERSION}")
    settings.UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
    try:
        await init_db()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        logger.warning("App starting without database — only static routes available")
    yield
    try:
        await close_db()
    except Exception:
        pass
    logger.info("Application shutdown complete")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_PATH)), name="uploads")

app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(chatbot_routes.router, prefix="/api/v1")
app.include_router(document_routes.router, prefix="/api/v1")
app.include_router(quiz_routes.router, prefix="/api/v1")
app.include_router(studyplan_routes.router, prefix="/api/v1")
app.include_router(recommendation_routes.router, prefix="/api/v1")
app.include_router(dashboard_routes.router, prefix="/api/v1")
app.include_router(student_routes.router, prefix="/api/v1")
app.include_router(role_routes.student_router, prefix="/api/v1")
app.include_router(role_routes.faculty_router, prefix="/api/v1")
app.include_router(role_routes.admin_router, prefix="/api/v1")
app.include_router(assessment_routes.router, prefix="/api/v1")
app.include_router(attendance_routes.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
