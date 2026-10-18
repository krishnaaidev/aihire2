import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.question import Question
from app.models.response import CandidateResponse
from app.models.report import EvaluationReport
from app.schemas.interview import InterviewCreate, InterviewOut, AnswerSubmit, DynamicQuestionResponse, QuestionOut
from app.services.question_generator import QuestionGenerator
from app.services.answer_evaluator import AnswerEvaluator
from app.services.candidate_matcher import CandidateMatcher
from app.services.report_generator import ReportGenerator
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])

@router.post("", response_model=InterviewOut)
async def create_interview(
    interview_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        candidate = Candidate(user_id=current_user.id)
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Mandatory Resume Check: Interview cannot start without resume
    if not candidate.resume_filename or not candidate.resume_text or not candidate.resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume required: Jab tak resume upload na ho tab tak interview start nahi hoga. Please upload your resume first."
        )

    job = db.query(Job).filter(Job.id == interview_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if there is already an in-progress interview for this job
    existing = db.query(Interview).filter(
        Interview.candidate_id == candidate.id,
        Interview.job_id == job.id,
        Interview.status.in_(["scheduled", "in_progress"])
    ).first()

    if existing:
        return _format_interview_out(existing, db)

    # Create new interview
    interview = Interview(
        candidate_id=candidate.id,
        job_id=job.id,
        mode=interview_in.mode or "text",
        status="in_progress",
        current_question_index=0,
        start_time=datetime.datetime.utcnow()
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Generate personalized questions
    cand_skills = json.loads(candidate.extracted_skills or "[]")
    cand_exp = json.loads(candidate.experience or "[]")
    cand_proj = json.loads(candidate.projects or "[]")
    job_skills = json.loads(job.required_skills or "[]")

    questions_data = await QuestionGenerator.generate_interview_questions(
        job_title=job.title,
        required_skills=job_skills,
        experience_level=job.experience,
        candidate_skills=cand_skills,
        candidate_experience=cand_exp,
        candidate_projects=cand_proj,
        num_questions=5
    )

    for q_data in questions_data:
        q = Question(
            interview_id=interview.id,
            question_text=q_data["question_text"],
            category=q_data["category"],
            difficulty=q_data["difficulty"],
            expected_key_points=json.dumps(q_data.get("expected_key_points", [])),
            order_index=q_data["order_index"]
        )
        db.add(q)

    db.commit()
    db.refresh(interview)

    return _format_interview_out(interview, db)

@router.get("/{interview_id}", response_model=InterviewOut)
def get_interview(interview_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    if not candidate or not candidate.resume_filename or not candidate.resume_text or not candidate.resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume required: Jab tak resume upload na ho tab tak interview start nahi hoga. Please upload your resume first."
        )

    return _format_interview_out(interview, db)

@router.post("/{interview_id}/answer", response_model=DynamicQuestionResponse)
async def submit_answer(
    interview_id: int,
    ans_in: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    question = db.query(Question).filter(Question.id == ans_in.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Evaluate answer with NLP / LLM evaluator
    key_points = json.loads(question.expected_key_points or "[]")
    eval_result = await AnswerEvaluator.evaluate_answer(
        question_text=question.question_text,
        category=question.category,
        expected_key_points=key_points,
        candidate_answer=ans_in.answer
    )

    # Save candidate response
    cand_resp = CandidateResponse(
        interview_id=interview.id,
        question_id=question.id,
        candidate_answer=ans_in.answer,
        transcript=ans_in.transcript or ans_in.answer,
        relevance_score=eval_result.get("relevance_score", 70.0),
        accuracy_score=eval_result.get("accuracy_score", 70.0),
        completeness_score=eval_result.get("completeness_score", 70.0),
        reasoning_score=eval_result.get("reasoning_score", 70.0),
        communication_score=eval_result.get("communication_score", 70.0),
        confidence_score=eval_result.get("confidence_score", 70.0),
        composite_score=eval_result.get("composite_score", 70.0),
        feedback=eval_result.get("feedback", "Good answer."),
        strengths_mentioned=json.dumps(eval_result.get("strengths", [])),
        improvements=json.dumps(eval_result.get("improvements", []))
    )
    db.add(cand_resp)

    # Increment current_question_index
    interview.current_question_index += 1
    db.commit()

    # Total questions
    questions = db.query(Question).filter(Question.interview_id == interview.id).order_by(Question.order_index).all()
    total_q = len(questions)

    # Check if more questions remain
    if interview.current_question_index < total_q:
        next_q = questions[interview.current_question_index]
        return DynamicQuestionResponse(
            completed=False,
            current_response_evaluation=eval_result,
            next_question=QuestionOut.model_validate(next_q),
            total_questions=total_q,
            current_index=interview.current_question_index
        )
    else:
        # Mark interview completed
        interview.status = "completed"
        interview.end_time = datetime.datetime.utcnow()
        db.commit()

        # Compute skill match score
        cand = interview.candidate
        job = interview.job
        cand_skills = json.loads(cand.extracted_skills or "[]")
        job_req_skills = json.loads(job.required_skills or "[]")
        job_pref_skills = json.loads(job.preferred_skills or "[]")

        match_res = CandidateMatcher.match_candidate_to_job(
            candidate_skills=cand_skills,
            candidate_resume_text=cand.resume_text or " ".join(cand_skills),
            job_required_skills=job_req_skills,
            job_preferred_skills=job_pref_skills,
            job_description_text=f"{job.title} {job.description}"
        )

        all_responses = db.query(CandidateResponse).filter(CandidateResponse.interview_id == interview.id).all()
        custom_weights = json.loads(job.scoring_weights) if job.scoring_weights else None

        cand_user = db.query(User).filter(User.id == cand.user_id).first()
        cand_name = cand_user.name if cand_user else "Candidate"

        report_data = await ReportGenerator.generate_evaluation_report(
            candidate_name=cand_name,
            job_title=job.title,
            skill_match_score=match_res["match_score"],
            responses=all_responses,
            custom_weights=custom_weights
        )

        # Update interview overall_score
        interview.overall_score = report_data["overall_score"]

        # Save Evaluation Report
        existing_report = db.query(EvaluationReport).filter(EvaluationReport.interview_id == interview.id).first()
        if not existing_report:
            eval_report = EvaluationReport(
                candidate_id=cand.id,
                interview_id=interview.id,
                job_id=job.id,
                skill_match_score=report_data["skill_match_score"],
                interview_score=report_data["interview_score"],
                overall_score=report_data["overall_score"],
                technical_score=report_data["technical_score"],
                problem_solving_score=report_data["problem_solving_score"],
                communication_score=report_data["communication_score"],
                role_relevance_score=report_data["role_relevance_score"],
                behavioral_score=report_data["behavioral_score"],
                strengths=json.dumps(report_data["strengths"]),
                weaknesses=json.dumps(report_data["weaknesses"]),
                question_analysis=json.dumps(report_data["question_analysis"]),
                summary=report_data["summary"],
                recommendation=report_data["recommendation"],
                decision_status="Pending"
            )
            db.add(eval_report)

        db.commit()

        return DynamicQuestionResponse(
            completed=True,
            current_response_evaluation=eval_result,
            next_question=None,
            total_questions=total_q,
            current_index=interview.current_question_index
        )

@router.get("/candidate/me", response_model=List[InterviewOut])
def get_my_interviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        return []
    interviews = db.query(Interview).filter(Interview.candidate_id == cand.id).order_by(Interview.created_at.desc()).all()
    return [_format_interview_out(i, db) for i in interviews]

@router.get("/job/{job_id}", response_model=List[InterviewOut])
def get_interviews_for_job(job_id: int, db: Session = Depends(get_db)):
    interviews = db.query(Interview).filter(Interview.job_id == job_id).order_by(Interview.created_at.desc()).all()
    return [_format_interview_out(i, db) for i in interviews]

def _format_interview_out(interview: Interview, db: Session) -> InterviewOut:
    cand_user = db.query(User).join(Candidate, Candidate.user_id == User.id).filter(Candidate.id == interview.candidate_id).first()
    job = interview.job or db.query(Job).filter(Job.id == interview.job_id).first()
    questions = db.query(Question).filter(Question.interview_id == interview.id).order_by(Question.order_index).all()

    return InterviewOut(
        id=interview.id,
        candidate_id=interview.candidate_id,
        job_id=interview.job_id,
        mode=interview.mode,
        status=interview.status,
        current_question_index=interview.current_question_index,
        overall_score=interview.overall_score or 0.0,
        start_time=interview.start_time,
        end_time=interview.end_time,
        created_at=interview.created_at,
        questions=[QuestionOut.model_validate(q) for q in questions],
        job_title=job.title if job else "",
        candidate_name=cand_user.name if cand_user else "Candidate"
    )
