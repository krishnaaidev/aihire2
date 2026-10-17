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
    is_active: Optional[bool] = None

class JobOut(JobBase):
    id: int
    recruiter_id: int
    is_active: bool
    created_at: datetime
    applicant_count: Optional[int] = 0
    interview_count: Optional[int] = 0

    class Config:
        from_attributes = True

class JobAnalysisRequest(BaseModel):
    raw_job_description: str
