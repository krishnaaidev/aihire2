import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    candidate_answer = Column(Text, nullable=False)
    transcript = Column(Text, default="")
    
    # 5 Key parameters from Synopsis Table 8.8 + confidence
    relevance_score = Column(Float, default=0.0)     # 0 - 100
    accuracy_score = Column(Float, default=0.0)      # 0 - 100
    completeness_score = Column(Float, default=0.0)  # 0 - 100
    reasoning_score = Column(Float, default=0.0)     # 0 - 100
    communication_score = Column(Float, default=0.0) # 0 - 100
    confidence_score = Column(Float, default=0.0)    # 0 - 100
    
    composite_score = Column(Float, default=0.0)     # 0 - 100
    feedback = Column(Text, default="")
    strengths_mentioned = Column(Text, default="[]") # JSON list
    improvements = Column(Text, default="[]")        # JSON list
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="responses")
    question = relationship("Question", back_populates="responses")
