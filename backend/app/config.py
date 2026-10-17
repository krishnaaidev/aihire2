import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "AIHire"
    PROJECT_VERSION: str = "1.0.0"
    DESCRIPTION: str = "Autonomous AI Interview & Intelligent Candidate Evaluation Platform"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aihire_super_secret_jwt_key_2026_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/aihire.db")
    
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # AI Providers (optional, falls back gracefully to built-in intelligent NLP engine)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Default Scoring Weights (as specified in Synopsis 8.9)
    DEFAULT_WEIGHTS = {
        "technical": 0.40,
        "problem_solving": 0.20,
        "communication": 0.15,
        "role_relevance": 0.15,
        "behavioral": 0.10
    }

settings = Settings()
