from app.api.auth import router as auth_router
from app.api.jobs import router as jobs_router
from app.api.candidates import router as candidates_router
from app.api.interviews import router as interviews_router
from app.api.reports import router as reports_router
from app.api.analytics import router as analytics_router
from app.api.websocket_interview import router as websocket_router

__all__ = [
    "auth_router",
    "jobs_router",
    "candidates_router",
    "interviews_router",
    "reports_router",
    "analytics_router",
    "websocket_router"
]
