import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import (
    auth_router,
    jobs_router,
    candidates_router,
    interviews_router,
    reports_router,
    analytics_router,
    websocket_router,
    admin_router
)
from app.utils.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIHire")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate new columns if existing SQLite DB already exists
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE interviews ADD COLUMN tab_switch_count INTEGER DEFAULT 0",
            "ALTER TABLE interviews ADD COLUMN paste_count INTEGER DEFAULT 0",
            "ALTER TABLE interviews ADD COLUMN integrity_score FLOAT DEFAULT 100.0",
            "ALTER TABLE interviews ADD COLUMN proctoring_flags TEXT",
            "ALTER TABLE interviews ADD COLUMN recruiter_status VARCHAR(50) DEFAULT 'Pending'",
            "ALTER TABLE evaluation_reports ADD COLUMN integrity_score FLOAT DEFAULT 100.0",
            "ALTER TABLE evaluation_reports ADD COLUMN tab_switches INTEGER DEFAULT 0",
            "ALTER TABLE evaluation_reports ADD COLUMN proctoring_summary TEXT",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass

    try:
        with SessionLocal() as db:
            seed_database(db)
        logger.info("Database schema and seed verified.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

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
app.include_router(admin_router)

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

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting uvicorn server on port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
