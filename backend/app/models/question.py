import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(50), default="technical") # technical, conceptual, scenario, project, behavioral
    difficulty = Column(String(30), default="medium")  # easy, medium, hard
    order_index = Column(Integer, default=0)
    expected_key_points = Column(Text, default="[]") # JSON list of key points candidate should mention
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="questions")
    responses = relationship("CandidateResponse", back_populates="question", cascade="all, delete-orphan")
