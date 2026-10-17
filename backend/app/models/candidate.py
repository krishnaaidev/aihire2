import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_filename = Column(String(255), default="")
    resume_text = Column(Text, default="")
    
    # Extracted structured fields (stored as JSON string or text)
    extracted_skills = Column(Text, default="[]") # JSON string list
    education = Column(Text, default="[]")        # JSON string list or dict
    experience = Column(Text, default="[]")       # JSON string list or dict
    projects = Column(Text, default="[]")         # JSON string list
    certifications = Column(Text, default="[]")   # JSON string list
    achievements = Column(Text, default="[]")     # JSON string list
    phone = Column(String(50), default="")
    linkedin_url = Column(String(255), default="")
    github_url = Column(String(255), default="")
    portfolio_url = Column(String(255), default="")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")
    reports = relationship("EvaluationReport", back_populates="candidate", cascade="all, delete-orphan")
