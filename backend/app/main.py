import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Mount frontend production dist if built
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if (frontend_dist / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # Check if a specific file exists in dist
    file_path = frontend_dist / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    
    # Return index.html for SPA client-side routes (/jobs, /recruiter, /candidate, etc.)
    index_file = frontend_dist / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "docs_url": "/docs"
    }
