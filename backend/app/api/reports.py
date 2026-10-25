import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.report import EvaluationReport
from app.schemas.report import ReportOut, ReportUpdateDecision, CandidateComparisonRequest, CandidateComparisonResponse, CandidateComparisonItem
from app.utils.security import get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(EvaluationReport).filter(EvaluationReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Evaluation report not found")
    return _format_report(report, db)

@router.get("/interview/{interview_id}", response_model=ReportOut)
def get_report_by_interview(interview_id: int, db: Session = Depends(get_db)):
    report = db.query(EvaluationReport).filter(EvaluationReport.interview_id == interview_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Evaluation report for this interview not found")
    return _format_report(report, db)

@router.put("/{report_id}/decision", response_model=ReportOut)
def update_decision(
    report_id: int,
    decision_in: ReportUpdateDecision,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    report = db.query(EvaluationReport).filter(EvaluationReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Evaluation report not found")

    if decision_in.decision_status:
        report.decision_status = decision_in.decision_status
    if decision_in.recruiter_notes is not None:
        report.recruiter_notes = decision_in.recruiter_notes

    db.commit()
    db.refresh(report)
    return _format_report(report, db)

@router.post("/compare", response_model=CandidateComparisonResponse)
def compare_candidates(
    comp_req: CandidateComparisonRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Candidate Comparison Module (Synopsis Section 8.11 & 12.14).
    Enables recruiters to compare multiple candidates side-by-side across scores and categories.
    """
    job = db.query(Job).filter(Job.id == comp_req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    comparison_items = []
    for cid in comp_req.candidate_ids:
        cand = db.query(Candidate).filter(Candidate.id == cid).first()
        if not cand:
            continue
        user = db.query(User).filter(User.id == cand.user_id).first()
        report = db.query(EvaluationReport).filter(
            EvaluationReport.candidate_id == cid,
            EvaluationReport.job_id == job.id
        ).order_by(EvaluationReport.created_at.desc()).first()

        strengths = json.loads(report.strengths) if report and report.strengths else []
        matched_skills = json.loads(cand.extracted_skills or "[]")

        comparison_items.append(CandidateComparisonItem(
            candidate_id=cand.id,
            candidate_name=user.name if user else "Candidate",
            email=user.email if user else "",
            overall_score=report.overall_score if report else 0.0,
            skill_match_score=report.skill_match_score if report else 0.0,
            interview_score=report.interview_score if report else 0.0,
            technical_score=report.technical_score if report else 0.0,
            problem_solving_score=report.problem_solving_score if report else 0.0,
            communication_score=report.communication_score if report else 0.0,
            role_relevance_score=report.role_relevance_score if report else 0.0,
            behavioral_score=report.behavioral_score if report else 0.0,
            recommendation=report.recommendation if report else "Not Interviewed",
            decision_status=report.decision_status if report else "Pending",
            key_strengths=strengths[:3],
            matched_skills=matched_skills[:5]
        ))

    return CandidateComparisonResponse(
        job_id=job.id,
        job_title=job.title,
        comparison=comparison_items
    )

def _format_report(report: EvaluationReport, db: Session) -> ReportOut:
    cand_user = db.query(User).join(Candidate, Candidate.user_id == User.id).filter(Candidate.id == report.candidate_id).first()
    job = db.query(Job).filter(Job.id == report.job_id).first()

    return ReportOut(
        id=report.id,
        candidate_id=report.candidate_id,
        interview_id=report.interview_id,
        job_id=report.job_id,
        job_title=job.title if job else "",
        candidate_name=cand_user.name if cand_user else "Candidate",
        candidate_email=cand_user.email if cand_user else "",
        skill_match_score=report.skill_match_score,
        interview_score=report.interview_score,
        overall_score=report.overall_score,
        technical_score=report.technical_score,
        problem_solving_score=report.problem_solving_score,
        communication_score=report.communication_score,
        role_relevance_score=report.role_relevance_score,
        behavioral_score=report.behavioral_score,
        strengths=json.loads(report.strengths or "[]"),
        weaknesses=json.loads(report.weaknesses or "[]"),
        question_analysis=json.loads(report.question_analysis or "[]"),
        summary=report.summary or "",
        recommendation=report.recommendation or "Consider",
        recruiter_notes=report.recruiter_notes or "",
        decision_status=report.decision_status or "Pending",
        integrity_score=report.integrity_score if report.integrity_score is not None else 100.0,
        tab_switches=report.tab_switches or 0,
        proctoring_summary=report.proctoring_summary or "Clean session - No integrity violations detected.",
        created_at=report.created_at
    )
