from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class JobBase(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    description: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    experience: str
    education: Optional[str] = "Bachelor's in Computer Science or related field"
    responsibilities: Optional[str] = ""
    scoring_weights: Optional[Dict[str, float]] = None
    location: Optional[str] = "Bengaluru / Hybrid"
    work_mode: Optional[str] = "Hybrid"
    salary_range: Optional[str] = "Competitive CTC"
    openings: Optional[int] = 3
    employment_type: Optional[str] = "Full-Time"
    experience_level: Optional[str] = "Fresher"
    eligibility: Optional[str] = ""
    selection_process: Optional[str] = ""

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    responsibilities: Optional[str] = None
    scoring_weights: Optional[Dict[str, float]] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    salary_range: Optional[str] = None
    openings: Optional[int] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    eligibility: Optional[str] = None
    selection_process: Optional[str] = None
    is_active: Optional[bool] = None

class JobOut(JobBase):
    id: int
    recruiter_id: int
    is_active: bool
    created_at: datetime
    applicant_count: Optional[int] = 0
    interview_count: Optional[int] = 0
    match_score: Optional[float] = None
    fit_level: Optional[str] = None
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []

    class Config:
        from_attributes = True

class JobAnalysisRequest(BaseModel):
    raw_job_description: str
