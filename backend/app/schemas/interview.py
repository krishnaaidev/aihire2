from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class QuestionOut(BaseModel):
    id: int
    interview_id: int
    question_text: str
    category: str
    difficulty: str
    order_index: int

    class Config:
        from_attributes = True

class ResponseOut(BaseModel):
    id: int
    question_id: int
    candidate_answer: str
    transcript: Optional[str] = ""
    relevance_score: float
    accuracy_score: float
    completeness_score: float
    reasoning_score: float
    communication_score: float
    composite_score: float
    feedback: str
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    job_id: int
    mode: Optional[str] = "text" # "text", "voice"

class InterviewOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    mode: str
    status: str
    current_question_index: int
    overall_score: float
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    questions: Optional[List[QuestionOut]] = []
    job_title: Optional[str] = None
    candidate_name: Optional[str] = None

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    interview_id: int
    question_id: int
    answer: str
    transcript: Optional[str] = ""

class DynamicQuestionResponse(BaseModel):
    completed: bool
    current_response_evaluation: Optional[Any] = None
    next_question: Optional[QuestionOut] = None
    total_questions: int
    current_index: int
