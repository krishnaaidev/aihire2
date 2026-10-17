import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    department = Column(String(100), default="Engineering")
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False)  # JSON-string array: ["Python", "FastAPI", "React"]
    preferred_skills = Column(Text, default="[]")   # JSON-string array
    experience = Column(String(100), nullable=False) # e.g. "2-5 years"
    education = Column(String(150), default="Bachelor's in Computer Science or related field")
    responsibilities = Column(Text, default="")
    scoring_weights = Column(Text, default="") # JSON custom weights if overridden
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    recruiter = relationship("User", back_populates="jobs")
    interviews = relationship("Interview", back_populates="job", cascade="all, delete-orphan")
