import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False, unique=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    skill_match_score = Column(Float, default=0.0)      # 0 - 100
    interview_score = Column(Float, default=0.0)        # 0 - 100
    overall_score = Column(Float, default=0.0)          # 0 - 100
    
    # 5 Weighted Components (from Section 8.9)
    technical_score = Column(Float, default=0.0)        # 40% weight
    problem_solving_score = Column(Float, default=0.0)  # 20% weight
    communication_score = Column(Float, default=0.0)    # 15% weight
    role_relevance_score = Column(Float, default=0.0)   # 15% weight
    behavioral_score = Column(Float, default=0.0)       # 10% weight
    
    strengths = Column(Text, default="[]")              # JSON array of strings
    weaknesses = Column(Text, default="[]")             # JSON array of strings
    question_analysis = Column(Text, default="[]")      # JSON array of structured evaluations
    summary = Column(Text, default="")
    recommendation = Column(String(50), default="Consider") # Strong Hire, Hire, Lean Hire, Consider, Do Not Hire
    
    recruiter_notes = Column(Text, default="")
    decision_status = Column(String(50), default="Pending") # Pending, Shortlisted, Rejected, Offered
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="reports")
    interview = relationship("Interview", back_populates="report")
    job = relationship("Job")
