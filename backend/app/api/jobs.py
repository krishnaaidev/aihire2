import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.interview import Interview
from app.schemas.job import JobCreate, JobUpdate, JobOut, JobAnalysisRequest
from app.services.job_analyzer import JobAnalyzer
from app.utils.security import get_current_user, require_role

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("", response_model=JobOut)
def create_job(job_in: JobCreate, current_user: User = Depends(require_role(["recruiter", "admin"])), db: Session = Depends(get_db)):
    job = Job(
        recruiter_id=current_user.id,
        title=job_in.title,
        department=job_in.department or "Engineering",
        description=job_in.description,
        required_skills=json.dumps(job_in.required_skills),
        preferred_skills=json.dumps(job_in.preferred_skills or []),
        experience=job_in.experience,
        education=job_in.education or "Bachelor's in Computer Science or related field",
        responsibilities=job_in.responsibilities or "",
        scoring_weights=json.dumps(job_in.scoring_weights) if job_in.scoring_weights else "",
        is_active=True
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Return JobOut
    out = JobOut(
        id=job.id,
        recruiter_id=job.recruiter_id,
        title=job.title,
        department=job.department,
        description=job.description,
        required_skills=json.loads(job.required_skills),
        preferred_skills=json.loads(job.preferred_skills),
        experience=job.experience,
        education=job.education,
        responsibilities=job.responsibilities,
        scoring_weights=json.loads(job.scoring_weights) if job.scoring_weights else None,
        is_active=job.is_active,
        created_at=job.created_at,
        applicant_count=0,
        interview_count=0
    )
    return out

@router.get("", response_model=List[JobOut])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.is_active == True).order_by(Job.created_at.desc()).all()
    results = []
    for j in jobs:
        interview_count = db.query(Interview).filter(Interview.job_id == j.id).count()
        results.append(JobOut(
            id=j.id,
            recruiter_id=j.recruiter_id,
            title=j.title,
            department=j.department,
            description=j.description,
            required_skills=json.loads(j.required_skills or "[]"),
            preferred_skills=json.loads(j.preferred_skills or "[]"),
            experience=j.experience,
            education=j.education,
            responsibilities=j.responsibilities,
            scoring_weights=json.loads(j.scoring_weights) if j.scoring_weights else None,
            is_active=j.is_active,
            created_at=j.created_at,
            applicant_count=interview_count,
            interview_count=interview_count
        ))
    return results

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job position not found")

    interview_count = db.query(Interview).filter(Interview.job_id == j.id).count()
    return JobOut(
        id=j.id,
        recruiter_id=j.recruiter_id,
        title=j.title,
        department=j.department,
        description=j.description,
        required_skills=json.loads(j.required_skills or "[]"),
        preferred_skills=json.loads(j.preferred_skills or "[]"),
        experience=j.experience,
        education=j.education,
        responsibilities=j.responsibilities,
        scoring_weights=json.loads(j.scoring_weights) if j.scoring_weights else None,
        is_active=j.is_active,
        created_at=j.created_at,
        applicant_count=interview_count,
        interview_count=interview_count
    )

@router.put("/{job_id}", response_model=JobOut)
def update_job(job_id: int, job_in: JobUpdate, current_user: User = Depends(require_role(["recruiter", "admin"])), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job position not found")

    if job_in.title is not None: j.title = job_in.title
    if job_in.department is not None: j.department = job_in.department
    if job_in.description is not None: j.description = job_in.description
    if job_in.required_skills is not None: j.required_skills = json.dumps(job_in.required_skills)
    if job_in.preferred_skills is not None: j.preferred_skills = json.dumps(job_in.preferred_skills)
    if job_in.experience is not None: j.experience = job_in.experience
    if job_in.education is not None: j.education = job_in.education
    if job_in.responsibilities is not None: j.responsibilities = job_in.responsibilities
    if job_in.scoring_weights is not None: j.scoring_weights = json.dumps(job_in.scoring_weights)
    if job_in.is_active is not None: j.is_active = job_in.is_active

    db.commit()
    db.refresh(j)

    interview_count = db.query(Interview).filter(Interview.job_id == j.id).count()
    return JobOut(
        id=j.id,
        recruiter_id=j.recruiter_id,
        title=j.title,
        department=j.department,
        description=j.description,
        required_skills=json.loads(j.required_skills or "[]"),
        preferred_skills=json.loads(j.preferred_skills or "[]"),
        experience=j.experience,
        education=j.education,
        responsibilities=j.responsibilities,
        scoring_weights=json.loads(j.scoring_weights) if j.scoring_weights else None,
        is_active=j.is_active,
        created_at=j.created_at,
        applicant_count=interview_count,
        interview_count=interview_count
    )

@router.delete("/{job_id}")
def delete_job(job_id: int, current_user: User = Depends(require_role(["recruiter", "admin"])), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job position not found")
    j.is_active = False
    db.commit()
    return {"message": "Job deactivated successfully"}

@router.post("/analyze")
async def analyze_job_text(req: JobAnalysisRequest):
    """AI analysis to extract structured requirements from raw JD text."""
    res = await JobAnalyzer.analyze_job_description(req.raw_job_description)
    return res
