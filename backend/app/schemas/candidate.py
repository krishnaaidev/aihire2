from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class CandidateBase(BaseModel):
    name: Optional[str] = None
    extracted_skills: Optional[List[str]] = []
    education: Optional[List[Any]] = []
    experience: Optional[List[Any]] = []
    projects: Optional[List[Any]] = []
    certifications: Optional[List[str]] = []
    achievements: Optional[List[str]] = []
    phone: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""

class CandidateCreate(CandidateBase):
    resume_text: Optional[str] = ""
    resume_filename: Optional[str] = ""

class CandidateUpdate(CandidateBase):
    pass

class CandidateOut(CandidateBase):
    id: int
    user_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    resume_filename: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class SkillMatchResult(BaseModel):
    candidate_id: int
    job_id: int
    match_score: float # 0 - 100
    matched_skills: List[str]
    missing_skills: List[str]
    fit_level: str # Excellent, Good, Moderate, Low
    recommendation: str
