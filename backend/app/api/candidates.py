import json
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.candidate import Candidate
from app.models.job import Job
from app.schemas.candidate import CandidateOut, CandidateUpdate, SkillMatchResult
from app.schemas.job import JobOut
from app.services.resume_parser import ResumeParser
from app.services.candidate_matcher import CandidateMatcher
from app.utils.security import get_current_user, require_role

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.post("/upload-resume", response_model=CandidateOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        candidate = Candidate(user_id=current_user.id)
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Save file
    file_ext = Path(file.filename).suffix.lower()
    save_path = settings.UPLOAD_DIR / f"resume_user_{current_user.id}_{file.filename}"
    
    file_bytes = await file.read()
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # Extract text
    raw_text = ""
    if file_ext == ".pdf":
        raw_text = ResumeParser.extract_text_from_pdf(file_bytes)
    else:
        try:
            raw_text = file_bytes.decode("utf-8")
        except Exception:
            raw_text = file_bytes.decode("latin-1", errors="ignore")

    # Parse resume
    parsed = await ResumeParser.parse_resume_full(raw_text)

    # Update candidate record
    candidate.resume_filename = file.filename
    candidate.resume_text = raw_text
    candidate.extracted_skills = json.dumps(parsed.get("skills", []))
    candidate.education = json.dumps(parsed.get("education", []))
    candidate.experience = json.dumps(parsed.get("experience", []))
    candidate.projects = json.dumps(parsed.get("projects", []))
    candidate.certifications = json.dumps(parsed.get("certifications", []))
    candidate.achievements = json.dumps(parsed.get("achievements", []))
    if parsed.get("phone"):
        candidate.phone = parsed["phone"]
    if parsed.get("linkedin"):
        candidate.linkedin_url = parsed["linkedin"]
    if parsed.get("github"):
        candidate.github_url = parsed["github"]

    # Also update user's name if parsed successfully and user has default name
    if parsed.get("name") and len(parsed["name"]) > 2 and current_user.name in ["Candidate", "User", ""]:
        current_user.name = parsed["name"]

    db.commit()
    db.refresh(candidate)

    return CandidateOut(
        id=candidate.id,
        user_id=candidate.user_id,
        candidate_name=current_user.name,
        candidate_email=current_user.email,
        resume_filename=candidate.resume_filename,
        extracted_skills=json.loads(candidate.extracted_skills or "[]"),
        education=json.loads(candidate.education or "[]"),
        experience=json.loads(candidate.experience or "[]"),
        projects=json.loads(candidate.projects or "[]"),
        certifications=json.loads(candidate.certifications or "[]"),
        achievements=json.loads(candidate.achievements or "[]"),
        phone=candidate.phone,
        linkedin_url=candidate.linkedin_url,
        github_url=candidate.github_url,
        portfolio_url=candidate.portfolio_url,
        created_at=candidate.created_at
    )

@router.get("/me", response_model=CandidateOut)
def get_my_candidate_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        cand = Candidate(user_id=current_user.id)
        db.add(cand)
        db.commit()
        db.refresh(cand)

    return CandidateOut(
        id=cand.id,
        user_id=cand.user_id,
        candidate_name=current_user.name,
        candidate_email=current_user.email,
        resume_filename=cand.resume_filename,
        extracted_skills=json.loads(cand.extracted_skills or "[]"),
        education=json.loads(cand.education or "[]"),
        experience=json.loads(cand.experience or "[]"),
        projects=json.loads(cand.projects or "[]"),
        certifications=json.loads(cand.certifications or "[]"),
        achievements=json.loads(cand.achievements or "[]"),
        phone=cand.phone,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        portfolio_url=cand.portfolio_url,
        created_at=cand.created_at
    )

@router.put("/me", response_model=CandidateOut)
def update_my_candidate_profile(
    cand_in: CandidateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        cand = Candidate(user_id=current_user.id)
        db.add(cand)

    if cand_in.name and cand_in.name.strip():
        current_user.name = cand_in.name.strip()
    if cand_in.extracted_skills is not None: cand.extracted_skills = json.dumps(cand_in.extracted_skills)
    if cand_in.education is not None: cand.education = json.dumps(cand_in.education)
    if cand_in.experience is not None: cand.experience = json.dumps(cand_in.experience)
    if cand_in.projects is not None: cand.projects = json.dumps(cand_in.projects)
    if cand_in.certifications is not None: cand.certifications = json.dumps(cand_in.certifications)
    if cand_in.achievements is not None: cand.achievements = json.dumps(cand_in.achievements)
    if cand_in.phone is not None: cand.phone = cand_in.phone
    if cand_in.linkedin_url is not None: cand.linkedin_url = cand_in.linkedin_url
    if cand_in.github_url is not None: cand.github_url = cand_in.github_url
    if cand_in.portfolio_url is not None: cand.portfolio_url = cand_in.portfolio_url

    db.commit()
    db.refresh(cand)

    return CandidateOut(
        id=cand.id,
        user_id=cand.user_id,
        candidate_name=current_user.name,
        candidate_email=current_user.email,
        resume_filename=cand.resume_filename,
        extracted_skills=json.loads(cand.extracted_skills or "[]"),
        education=json.loads(cand.education or "[]"),
        experience=json.loads(cand.experience or "[]"),
        projects=json.loads(cand.projects or "[]"),
        certifications=json.loads(cand.certifications or "[]"),
        achievements=json.loads(cand.achievements or "[]"),
        phone=cand.phone,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        portfolio_url=cand.portfolio_url,
        created_at=cand.created_at
    )

@router.get("", response_model=List[CandidateOut])
def list_candidates(current_user: User = Depends(require_role(["recruiter", "admin"])), db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    results = []
    for c in candidates:
        u = db.query(User).filter(User.id == c.user_id).first()
        results.append(CandidateOut(
            id=c.id,
            user_id=c.user_id,
            candidate_name=u.name if u else "Candidate",
            candidate_email=u.email if u else "",
            resume_filename=c.resume_filename,
            extracted_skills=json.loads(c.extracted_skills or "[]"),
            education=json.loads(c.education or "[]"),
            experience=json.loads(c.experience or "[]"),
            projects=json.loads(c.projects or "[]"),
            certifications=json.loads(c.certifications or "[]"),
            achievements=json.loads(c.achievements or "[]"),
            phone=c.phone,
            linkedin_url=c.linkedin_url,
            github_url=c.github_url,
            portfolio_url=c.portfolio_url,
            created_at=c.created_at
        ))
    return results

@router.post("/match/{job_id}", response_model=SkillMatchResult)
def match_candidate_to_job(
    job_id: int,
    candidate_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job position not found")

    if candidate_id and current_user.role in ["recruiter", "admin"]:
        cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    else:
        cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not cand:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    cand_skills = json.loads(cand.extracted_skills or "[]")
    job_req_skills = json.loads(job.required_skills or "[]")
    job_pref_skills = json.loads(job.preferred_skills or "[]")

    match_res = CandidateMatcher.match_candidate_to_job(
        candidate_skills=cand_skills,
        candidate_resume_text=cand.resume_text or " ".join(cand_skills),
        job_required_skills=job_req_skills,
        job_preferred_skills=job_pref_skills,
        job_description_text=f"{job.title} {job.description} {job.responsibilities}"
    )

    return SkillMatchResult(
        candidate_id=cand.id,
        job_id=job.id,
        match_score=match_res["match_score"],
        matched_skills=match_res["matched_skills"],
        missing_skills=match_res["missing_skills"],
        fit_level=match_res["fit_level"],
        recommendation=match_res["recommendation"]
    )

@router.get("/matched-jobs", response_model=List[JobOut])
def get_candidate_matched_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes hybrid TF-IDF + skill overlap match scores for all active jobs
    against the candidate's uploaded resume and extracted skills, returning
    them ranked by compatibility score.
    """
    from app.api.jobs import _format_job_out
    from app.models.interview import Interview

    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    jobs = db.query(Job).filter(Job.is_active == True).all()

    if not cand or not cand.extracted_skills:
        results = []
        for j in jobs:
            count = db.query(Interview).filter(Interview.job_id == j.id).count()
            results.append(_format_job_out(j, count))
        return results

    cand_skills = json.loads(cand.extracted_skills or "[]")
    resume_text = cand.resume_text or " ".join(cand_skills)

    matched_jobs = []
    for j in jobs:
        req_skills = json.loads(j.required_skills or "[]")
        pref_skills = json.loads(j.preferred_skills or "[]")
        count = db.query(Interview).filter(Interview.job_id == j.id).count()

        match_res = CandidateMatcher.match_candidate_to_job(
            candidate_skills=cand_skills,
            candidate_resume_text=resume_text,
            job_required_skills=req_skills,
            job_preferred_skills=pref_skills,
            job_description_text=f"{j.title} {j.description} {j.responsibilities or ''}"
        )

        job_out = _format_job_out(j, count)
        job_out.match_score = match_res["match_score"]
        job_out.fit_level = match_res["fit_level"]
        job_out.matched_skills = match_res["matched_skills"]
        job_out.missing_skills = match_res["missing_skills"]
        matched_jobs.append(job_out)

    matched_jobs.sort(key=lambda x: x.match_score or 0.0, reverse=True)
    return matched_jobs
