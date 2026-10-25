import json
import csv
import io
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
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
from app.schemas.interview import (
    InterviewCreate, 
    InterviewOut, 
    AnswerSubmit, 
    DynamicQuestionResponse, 
    QuestionOut,
    ProctoringEvent,
    InterviewStatusUpdate,
    InterviewCancelPayload
)
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

    # Check if candidate has a cancelled interview for this job (permanent block - candidate cannot retake)
    cancelled_interview = db.query(Interview).filter(
        Interview.candidate_id == candidate.id,
        Interview.job_id == job.id,
        Interview.status == "cancelled"
    ).first()
    if cancelled_interview:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Interview permanently cancelled due to academic integrity violation (prohibited object or face movement detected). Candidate is not allowed to give or retake this interview."
        )

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

    # Generate initial personalized Question 1 based on resume and job (no pre-added batch)
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
        num_questions=1
    )

    for q_data in questions_data:
        q = Question(
            interview_id=interview.id,
            question_text=q_data["question_text"],
            category=q_data["category"],
            difficulty=q_data["difficulty"],
            expected_key_points=json.dumps(q_data.get("expected_key_points", [])),
            order_index=1
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

    if interview.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This interview was cancelled due to academic integrity violation. You are not allowed to answer or retake."
        )

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

    # Adaptive Next Question Generation (Max 5 Questions)
    MAX_QUESTIONS = 5

    if interview.current_question_index < MAX_QUESTIONS:
        # Check if next question was already pre-seeded
        existing_questions = db.query(Question).filter(Question.interview_id == interview.id).order_by(Question.order_index).all()
        if interview.current_question_index < len(existing_questions):
            next_q = existing_questions[interview.current_question_index]
        else:
            # Dynamically generate follow-up question based on candidate's answer and topic
            cand = interview.candidate
            job = interview.job
            cand_skills = json.loads(cand.extracted_skills or "[]")
            job_skills = json.loads(job.required_skills or "[]")

            next_q_data = await QuestionGenerator.generate_adaptive_question_on_topic(
                job_title=job.title,
                required_skills=job_skills,
                candidate_skills=cand_skills,
                previous_question=question.question_text,
                candidate_answer=ans_in.answer,
                eval_feedback=eval_result.get("feedback", ""),
                order_index=interview.current_question_index + 1
            )

            next_q = Question(
                interview_id=interview.id,
                question_text=next_q_data["question_text"],
                category=next_q_data.get("category", "technical"),
                difficulty=next_q_data.get("difficulty", "medium"),
                expected_key_points=json.dumps(next_q_data.get("expected_key_points", [])),
                order_index=interview.current_question_index + 1
            )
            db.add(next_q)
            db.commit()
            db.refresh(next_q)

        return DynamicQuestionResponse(
            completed=False,
            current_response_evaluation=eval_result,
            next_question=QuestionOut.model_validate(next_q),
            total_questions=MAX_QUESTIONS,
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
            # Proctoring summary message
            proc_msg = "Clean session - No integrity violations detected."
            if (interview.tab_switch_count or 0) > 0 or (interview.paste_count or 0) > 0:
                proc_msg = f"Observed {interview.tab_switch_count} tab switch(es) and {interview.paste_count} copy-paste attempt(s)."

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
                decision_status=interview.recruiter_status or "Pending",
                integrity_score=interview.integrity_score if interview.integrity_score is not None else 100.0,
                tab_switches=interview.tab_switch_count or 0,
                proctoring_summary=proc_msg
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

@router.post("/{interview_id}/proctoring-event")
def log_proctoring_event(
    interview_id: int,
    event: ProctoringEvent,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    flags = json.loads(interview.proctoring_flags or "[]")
    timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    if event.event_type == "tab_switch":
        interview.tab_switch_count = (interview.tab_switch_count or 0) + 1
        flags.append(f"Tab switch / window unfocused at {timestamp_str}")
    elif event.event_type == "paste_attempt":
        interview.paste_count = (interview.paste_count or 0) + 1
        flags.append(f"Copy-paste attempt blocked at {timestamp_str}")
    else:
        flags.append(f"{event.event_type} at {timestamp_str} ({event.details})")

    # Compute updated integrity score: -8% per tab switch, -4% per paste attempt, min 0
    calculated_score = max(0.0, 100.0 - (interview.tab_switch_count * 8.0) - (interview.paste_count * 4.0))
    interview.integrity_score = round(calculated_score, 1)
    interview.proctoring_flags = json.dumps(flags)

    # Sync with report if already created
    if interview.report:
        interview.report.integrity_score = interview.integrity_score
        interview.report.tab_switches = interview.tab_switch_count
        interview.report.proctoring_summary = f"Recorded {interview.tab_switch_count} tab switch(es) and {interview.paste_count} paste attempt(s)."

    db.commit()
    return {
        "status": "logged",
        "integrity_score": interview.integrity_score,
        "tab_switches": interview.tab_switch_count,
        "paste_count": interview.paste_count
    }

@router.patch("/{interview_id}/status")
def update_interview_recruiter_status(
    interview_id: int,
    status_update: InterviewStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    new_status = status_update.recruiter_status or status_update.status or "Pending"
    interview.recruiter_status = new_status
    if interview.report:
        interview.report.decision_status = new_status
        if status_update.notes:
            interview.report.recruiter_notes = status_update.notes

    db.commit()
    return {
        "message": "Status updated successfully",
        "status": interview.recruiter_status,
        "recruiter_status": interview.recruiter_status
    }

@router.post("/{interview_id}/cancel")
def cancel_interview(
    interview_id: int,
    payload: Optional[InterviewCancelPayload] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    reason = payload.reason if payload and payload.reason else "Session Cancelled: Prohibited object (mobile phone) or face movement detected."
    violation_type = payload.violation_type if payload and payload.violation_type else "malpractice"
    interview.status = "cancelled"
    interview.recruiter_status = "Rejected (Proctoring Violation)"
    interview.integrity_score = 0.0

    flags = json.loads(interview.proctoring_flags or "[]")
    flags.append({
        "event": "interview_cancelled",
        "violation_type": violation_type,
        "reason": reason,
        "permanent_disqualification": True,
        "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    })
    interview.proctoring_flags = json.dumps(flags)

    if interview.report:
        interview.report.decision_status = "Rejected"
        interview.report.recommendation = "Disqualified (Proctoring Violation)"
        interview.report.integrity_score = 0.0
        interview.report.proctoring_summary = f"Session Terminated & Permanently Disqualified: {reason}"

    db.commit()
    return {
        "status": "cancelled",
        "message": reason,
        "recruiter_status": interview.recruiter_status,
        "integrity_score": interview.integrity_score,
        "retake_allowed": False
    }

@router.post("/{interview_id}/shuffle-questions")
def shuffle_interview_questions(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import random
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.status == "cancelled":
        raise HTTPException(status_code=403, detail="Interview is cancelled.")

    current_idx = interview.current_question_index
    questions = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.order_index > current_idx
    ).all()

    if questions and len(questions) > 1:
        indices = [q.order_index for q in questions]
        random.shuffle(indices)
        for q, new_idx in zip(questions, indices):
            q.order_index = new_idx
        db.commit()

    return {"message": "Remaining questions shuffled successfully"}

@router.get("/job/{job_id}/export-csv")
def export_job_candidates_csv(job_id: int, db: Session = Depends(get_db)):
    """Export evaluated candidates for a job (or all jobs if job_id=0) as a structured CSV."""
    if job_id == 0:
        interviews = db.query(Interview).order_by(Interview.created_at.desc()).all()
        filename = "AIHire_All_Applicants.csv"
    else:
        interviews = db.query(Interview).filter(Interview.job_id == job_id).order_by(Interview.created_at.desc()).all()
        job = db.query(Job).filter(Job.id == job_id).first()
        job_slug = job.title.replace(" ", "_") if job else f"Job_{job_id}"
        filename = f"AIHire_Candidates_{job_slug}.csv"

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Interview ID",
        "Candidate Name",
        "Candidate Email",
        "Job Title",
        "Department",
        "Overall Score",
        "Skill Match Score",
        "Technical Score",
        "Problem Solving Score",
        "Communication Score",
        "Integrity Score (%)",
        "Tab Switches",
        "Recommendation",
        "Recruiter Decision Status",
        "Date Completed"
    ])

    for iv in interviews:
        cand_user = db.query(User).join(Candidate, Candidate.user_id == User.id).filter(Candidate.id == iv.candidate_id).first()
        cand_name = cand_user.name if cand_user else f"Candidate #{iv.candidate_id}"
        cand_email = cand_user.email if cand_user else ""
        job_obj = iv.job or db.query(Job).filter(Job.id == iv.job_id).first()
        rep = iv.report

        writer.writerow([
            iv.id,
            cand_name,
            cand_email,
            job_obj.title if job_obj else "Unknown Role",
            job_obj.department if job_obj else "Engineering",
            rep.overall_score if rep else (iv.overall_score or 0.0),
            rep.skill_match_score if rep else 0.0,
            rep.technical_score if rep else 0.0,
            rep.problem_solving_score if rep else 0.0,
            rep.communication_score if rep else 0.0,
            iv.integrity_score if iv.integrity_score is not None else 100.0,
            iv.tab_switch_count or 0,
            rep.recommendation if rep else "Pending Evaluation",
            iv.recruiter_status or (rep.decision_status if rep else "Pending"),
            iv.created_at.strftime("%Y-%m-%d %H:%M") if iv.created_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/candidate/me", response_model=List[InterviewOut])
def get_my_interviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        return []
    interviews = db.query(Interview).filter(Interview.candidate_id == cand.id).order_by(Interview.created_at.desc()).all()
    return [_format_interview_out(i, db) for i in interviews]

@router.get("/job/{job_id}", response_model=List[InterviewOut])
def get_interviews_for_job(job_id: str, db: Session = Depends(get_db)):
    if job_id in ["all", "0"]:
        interviews = db.query(Interview).order_by(Interview.created_at.desc()).all()
    else:
        try:
            jid = int(job_id)
            interviews = db.query(Interview).filter(Interview.job_id == jid).order_by(Interview.created_at.desc()).all()
        except ValueError:
            interviews = db.query(Interview).order_by(Interview.created_at.desc()).all()
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
        candidate_name=cand_user.name if cand_user else "Candidate",
        tab_switch_count=interview.tab_switch_count or 0,
        paste_count=interview.paste_count or 0,
        integrity_score=interview.integrity_score if interview.integrity_score is not None else 100.0,
        recruiter_status=interview.recruiter_status or "Pending",
        proctoring_flags=json.loads(interview.proctoring_flags or "[]")
    )
