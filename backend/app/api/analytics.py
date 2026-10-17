from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.report import EvaluationReport
from app.utils.security import require_role

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/recruiter")
def get_recruiter_analytics(current_user: User = Depends(require_role(["recruiter", "admin"])), db: Session = Depends(get_db)):
    total_jobs = db.query(Job).filter(Job.is_active == True).count()
    total_candidates = db.query(Candidate).count()
    completed_interviews = db.query(Interview).filter(Interview.status == "completed").count()
    in_progress_interviews = db.query(Interview).filter(Interview.status == "in_progress").count()

    avg_score_res = db.query(func.avg(EvaluationReport.overall_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res else 0.0

    shortlisted_count = db.query(EvaluationReport).filter(EvaluationReport.decision_status == "Shortlisted").count()
    offered_count = db.query(EvaluationReport).filter(EvaluationReport.decision_status == "Offered").count()
    rejected_count = db.query(EvaluationReport).filter(EvaluationReport.decision_status == "Rejected").count()

    # Recent completed reports
    recent_reports = db.query(EvaluationReport).order_by(EvaluationReport.created_at.desc()).limit(5).all()
    recent_activity = []
    for r in recent_reports:
        cand_user = db.query(User).join(Candidate, Candidate.user_id == User.id).filter(Candidate.id == r.candidate_id).first()
        job = db.query(Job).filter(Job.id == r.job_id).first()
        recent_activity.append({
            "report_id": r.id,
            "candidate_name": cand_user.name if cand_user else "Candidate",
            "job_title": job.title if job else "Engineering",
            "overall_score": r.overall_score,
            "recommendation": r.recommendation,
            "decision_status": r.decision_status,
            "created_at": r.created_at
        })

    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "completed_interviews": completed_interviews,
        "in_progress_interviews": in_progress_interviews,
        "avg_score": avg_score,
        "shortlisted_count": shortlisted_count,
        "offered_count": offered_count,
        "rejected_count": rejected_count,
        "recent_activity": recent_activity
    }
