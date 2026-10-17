import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    mode = Column(String(20), default="text") # text, voice
    status = Column(String(30), default="scheduled") # scheduled, in_progress, completed, abandoned
    current_question_index = Column(Integer, default=0)
    overall_score = Column(Float, default=0.0)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="interviews")
    job = relationship("Job", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("CandidateResponse", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("EvaluationReport", back_populates="interview", uselist=False, cascade="all, delete-orphan")
