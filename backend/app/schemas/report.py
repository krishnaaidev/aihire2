from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ReportOut(BaseModel):
    id: int
    candidate_id: int
    interview_id: int
    job_id: int
    job_title: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    
    skill_match_score: float
    interview_score: float
    overall_score: float
    
    technical_score: float
    problem_solving_score: float
    communication_score: float
    role_relevance_score: float
    behavioral_score: float
    
    strengths: List[str]
    weaknesses: List[str]
    question_analysis: List[Dict[str, Any]]
    summary: str
    recommendation: str
    recruiter_notes: Optional[str] = ""
    decision_status: str
    
    # Proctoring Assessment
    integrity_score: Optional[float] = 100.0
    tab_switches: Optional[int] = 0
    proctoring_summary: Optional[str] = "Clean session - No integrity violations detected."
    
    created_at: datetime

    class Config:
        from_attributes = True

class ReportUpdateDecision(BaseModel):
    decision_status: str # Pending, Shortlisted, Rejected, Offered
    recruiter_notes: Optional[str] = None

class CandidateComparisonRequest(BaseModel):
    candidate_ids: List[int]
    job_id: int

class CandidateComparisonItem(BaseModel):
    candidate_id: int
    candidate_name: str
    email: str
    overall_score: float
    skill_match_score: float
    interview_score: float
    technical_score: float
    problem_solving_score: float
    communication_score: float
    role_relevance_score: float
    behavioral_score: float
    recommendation: str
    decision_status: str
    key_strengths: List[str]
    matched_skills: List[str]

class CandidateComparisonResponse(BaseModel):
    job_id: int
    job_title: str
    comparison: List[CandidateComparisonItem]
