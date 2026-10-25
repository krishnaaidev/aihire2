import json
import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.interview import Interview
from app.models.report import EvaluationReport
from app.utils.security import get_current_user, require_role

router = APIRouter(prefix="/api/admin", tags=["Super Admin"])

def parse_json_field(val, default):
    if not val:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default

@router.get("/metrics")
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Platform-wide system metrics for Super Admin Dashboard."""
    total_candidates = db.query(Candidate).count()
    total_recruiters = db.query(User).filter(User.role == "recruiter").count()
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.is_active == True).count()
    total_interviews = db.query(Interview).count()
    completed_interviews = db.query(Interview).filter(Interview.status == "completed").count()
    cancelled_interviews = db.query(Interview).filter(Interview.status == "cancelled").count()
    in_progress_interviews = db.query(Interview).filter(Interview.status.in_(["scheduled", "in_progress"])).count()

    # Average scores
    completed_ivs = db.query(Interview).filter(Interview.status == "completed").all()
    avg_merit_score = (
        round(sum(iv.overall_score for iv in completed_ivs) / len(completed_ivs), 1)
        if completed_ivs else 0.0
    )

    all_ivs = db.query(Interview).all()
    avg_integrity_score = (
        round(sum(iv.integrity_score for iv in all_ivs if iv.integrity_score is not None) / len(all_ivs), 1)
        if all_ivs else 100.0
    )

    candidates_with_resume = db.query(Candidate).filter(
        Candidate.resume_filename != None,
        Candidate.resume_filename != ""
    ).count()

    return {
        "total_candidates": total_candidates,
        "candidates_with_resume": candidates_with_resume,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "cancelled_interviews": cancelled_interviews,
        "in_progress_interviews": in_progress_interviews,
        "avg_merit_score": avg_merit_score,
        "avg_integrity_score": avg_integrity_score,
        "admin_name": current_user.name,
        "admin_email": current_user.email
    }

@router.get("/candidates")
def get_all_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Retrieve full details of all candidates including parsed resume data and interview history."""
    candidates = db.query(Candidate).all()
    candidate_list = []

    for c in candidates:
        user = c.user
        if not user:
            continue

        ivs = db.query(Interview).filter(Interview.candidate_id == c.id).all()
        completed_ivs = [iv for iv in ivs if iv.status == "completed"]
        cancelled_ivs = [iv for iv in ivs if iv.status == "cancelled"]

        avg_score = (
            round(sum(iv.overall_score for iv in completed_ivs) / len(completed_ivs), 1)
            if completed_ivs else None
        )

        interviews_summary = []
        for iv in ivs:
            job = iv.job
            report = iv.report
            proctoring_list = parse_json_field(iv.proctoring_flags, [])
            interviews_summary.append({
                "id": iv.id,
                "job_id": iv.job_id,
                "job_title": job.title if job else "N/A",
                "job_department": job.department if job else "N/A",
                "status": iv.status,
                "mode": iv.mode,
                "overall_score": iv.overall_score,
                "integrity_score": iv.integrity_score,
                "tab_switch_count": iv.tab_switch_count,
                "paste_count": iv.paste_count,
                "recruiter_status": iv.recruiter_status,
                "has_violations": len(proctoring_list) > 0 or iv.status == "cancelled",
                "proctoring_flags": proctoring_list,
                "created_at": iv.created_at.isoformat() if iv.created_at else None,
                "has_report": bool(report)
            })

        candidate_list.append({
            "id": c.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": c.phone or "N/A",
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "has_resume": bool(c.resume_filename),
            "resume_filename": c.resume_filename or None,
            "extracted_skills": parse_json_field(c.extracted_skills, []),
            "education": parse_json_field(c.education, []),
            "experience": parse_json_field(c.experience, []),
            "projects": parse_json_field(c.projects, []),
            "certifications": parse_json_field(c.certifications, []),
            "achievements": parse_json_field(c.achievements, []),
            "linkedin_url": c.linkedin_url or None,
            "github_url": c.github_url or None,
            "portfolio_url": c.portfolio_url or None,
            "total_interviews": len(ivs),
            "completed_interviews": len(completed_ivs),
            "cancelled_interviews": len(cancelled_ivs),
            "avg_score": avg_score,
            "interviews": interviews_summary
        })

    return candidate_list

@router.get("/recruiters")
def get_all_recruiters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Retrieve full details of all recruiters and their active job requisitions."""
    recruiters = db.query(User).filter(User.role == "recruiter").all()
    recruiter_list = []

    for r in recruiters:
        jobs = db.query(Job).filter(Job.recruiter_id == r.id).all()
        jobs_summary = []
        total_applicants = 0
        total_completed = 0
        total_cancelled = 0

        for j in jobs:
            job_ivs = db.query(Interview).filter(Interview.job_id == j.id).all()
            app_count = len(job_ivs)
            comp_count = len([iv for iv in job_ivs if iv.status == "completed"])
            canc_count = len([iv for iv in job_ivs if iv.status == "cancelled"])

            total_applicants += app_count
            total_completed += comp_count
            total_cancelled += canc_count

            jobs_summary.append({
                "id": j.id,
                "title": j.title,
                "department": j.department,
                "experience": j.experience,
                "salary_range": j.salary_range,
                "work_mode": j.work_mode,
                "openings": j.openings,
                "is_active": j.is_active,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "required_skills": parse_json_field(j.required_skills, []),
                "preferred_skills": parse_json_field(j.preferred_skills, []),
                "applicant_count": app_count,
                "completed_count": comp_count,
                "cancelled_count": canc_count
            })

        recruiter_list.append({
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "total_jobs": len(jobs),
            "total_applicants": total_applicants,
            "total_completed": total_completed,
            "total_cancelled": total_cancelled,
            "jobs": jobs_summary
        })

    return recruiter_list

@router.get("/interviews")
def get_all_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Retrieve full session and proctoring audit log for all interviews."""
    interviews = db.query(Interview).order_by(Interview.id.desc()).all()
    interview_list = []

    for iv in interviews:
        cand = iv.candidate
        user = cand.user if cand else None
        job = iv.job
        recruiter = job.recruiter if job else None
        report = iv.report
        proctoring_list = parse_json_field(iv.proctoring_flags, [])

        interview_list.append({
            "id": iv.id,
            "candidate_id": cand.id if cand else None,
            "candidate_name": user.name if user else "N/A",
            "candidate_email": user.email if user else "N/A",
            "job_id": job.id if job else None,
            "job_title": job.title if job else "N/A",
            "job_department": job.department if job else "N/A",
            "recruiter_id": recruiter.id if recruiter else None,
            "recruiter_name": recruiter.name if recruiter else "N/A",
            "recruiter_email": recruiter.email if recruiter else "N/A",
            "status": iv.status,
            "mode": iv.mode,
            "current_question_index": iv.current_question_index,
            "overall_score": iv.overall_score,
            "integrity_score": iv.integrity_score,
            "tab_switch_count": iv.tab_switch_count,
            "paste_count": iv.paste_count,
            "recruiter_status": iv.recruiter_status,
            "has_violations": len(proctoring_list) > 0 or iv.status == "cancelled",
            "proctoring_flags": proctoring_list,
            "report_id": report.id if report else None,
            "created_at": iv.created_at.isoformat() if iv.created_at else None,
            "start_time": iv.start_time.isoformat() if iv.start_time else None,
            "end_time": iv.end_time.isoformat() if iv.end_time else None
        })

    return interview_list

@router.post("/interviews/{interview_id}/lift-disqualification")
def lift_disqualification(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Super Admin override: Lift disqualification/cancellation on an interview session."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")

    flags = parse_json_field(interview.proctoring_flags, [])
    flags.append({
        "type": "admin_override",
        "reason": f"Disqualification cleared by Super Admin ({current_user.email})",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "disqualification_lifted",
        "retake_allowed": True
    })

    interview.status = "in_progress"
    interview.recruiter_status = "Pending (Admin Cleared)"
    interview.integrity_score = 100.0
    interview.proctoring_flags = json.dumps(flags)
    db.commit()

    return {
        "success": True,
        "message": f"Disqualification lifted for Interview #{interview_id}. Candidate is now permitted to take the interview.",
        "interview_id": interview.id,
        "status": interview.status
    }

@router.delete("/interviews/{interview_id}")
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Super Admin override: Delete an interview session."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")

    db.delete(interview)
    db.commit()
    return {"success": True, "message": f"Interview #{interview_id} successfully deleted"}

@router.get("/export/{entity}")
def export_csv(
    entity: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Export complete candidates, recruiters, or interviews database as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)

    if entity == "candidates":
        writer.writerow([
            "Candidate ID", "Name", "Email", "Phone", "Resume Uploaded", "Resume File",
            "Extracted Skills Count", "Skills", "Total Interviews", "Completed Interviews",
            "Cancelled Interviews", "Avg Score", "LinkedIn", "GitHub", "Portfolio", "Registered Date"
        ])
        candidates = db.query(Candidate).all()
        for c in candidates:
            user = c.user
            if not user:
                continue
            skills = parse_json_field(c.extracted_skills, [])
            ivs = db.query(Interview).filter(Interview.candidate_id == c.id).all()
            completed = [iv for iv in ivs if iv.status == "completed"]
            cancelled = [iv for iv in ivs if iv.status == "cancelled"]
            avg_score = round(sum(iv.overall_score for iv in completed) / len(completed), 1) if completed else "N/A"
            writer.writerow([
                c.id, user.name, user.email, c.phone or "N/A",
                "Yes" if c.resume_filename else "No", c.resume_filename or "",
                len(skills), ", ".join(skills), len(ivs), len(completed), len(cancelled),
                avg_score, c.linkedin_url or "", c.github_url or "", c.portfolio_url or "",
                user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else ""
            ])
        filename = "AIHire_All_Candidates_Admin_Report.csv"

    elif entity == "recruiters":
        writer.writerow([
            "Recruiter ID", "Name", "Email", "Total Jobs Posted", "Total Applicants",
            "Total Completed Interviews", "Total Cancelled", "Job Titles", "Registered Date"
        ])
        recruiters = db.query(User).filter(User.role == "recruiter").all()
        for r in recruiters:
            jobs = db.query(Job).filter(Job.recruiter_id == r.id).all()
            job_titles = [j.title for j in jobs]
            all_ivs = []
            for j in jobs:
                all_ivs.extend(db.query(Interview).filter(Interview.job_id == j.id).all())
            completed = [iv for iv in all_ivs if iv.status == "completed"]
            cancelled = [iv for iv in all_ivs if iv.status == "cancelled"]
            writer.writerow([
                r.id, r.name, r.email, len(jobs), len(all_ivs), len(completed), len(cancelled),
                "; ".join(job_titles), r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
            ])
        filename = "AIHire_All_Recruiters_Admin_Report.csv"

    elif entity == "interviews":
        writer.writerow([
            "Interview ID", "Candidate Name", "Candidate Email", "Job Title", "Department",
            "Recruiter Name", "Mode", "Status", "Overall Score", "Integrity Score",
            "Tab Switches", "Paste Count", "Recruiter Decision", "Violations Count", "Date"
        ])
        ivs = db.query(Interview).order_by(Interview.id.desc()).all()
        for iv in ivs:
            cand_user = iv.candidate.user if iv.candidate else None
            job = iv.job
            recruiter = job.recruiter if job else None
            flags = parse_json_field(iv.proctoring_flags, [])
            writer.writerow([
                iv.id,
                cand_user.name if cand_user else "N/A",
                cand_user.email if cand_user else "N/A",
                job.title if job else "N/A",
                job.department if job else "N/A",
                recruiter.name if recruiter else "N/A",
                iv.mode,
                iv.status,
                iv.overall_score,
                iv.integrity_score,
                iv.tab_switch_count,
                iv.paste_count,
                iv.recruiter_status,
                len(flags),
                iv.created_at.strftime("%Y-%m-%d %H:%M") if iv.created_at else ""
            ])
        filename = "AIHire_All_Interviews_Admin_Report.csv"
    else:
        raise HTTPException(status_code=400, detail="Invalid export entity type")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
