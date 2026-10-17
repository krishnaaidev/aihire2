import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import (
    auth_router,
    jobs_router,
    candidates_router,
    interviews_router,
    reports_router,
    analytics_router,
    websocket_router
)
from app.utils.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIHire")

# Create tables
Base.metadata.create_all(bind=engine)

# Seed database on startup
try:
    with SessionLocal() as db:
        seed_database(db)
except Exception as e:
    logger.error(f"Error seeding database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(interviews_router)
app.include_router(reports_router)
app.include_router(analytics_router)
app.include_router(websocket_router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "description": settings.DESCRIPTION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}
