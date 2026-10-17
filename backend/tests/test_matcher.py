import pytest
from app.services.candidate_matcher import CandidateMatcher

def test_skill_matcher():
    candidate_skills = ["Python", "FastAPI", "React", "Docker", "PostgreSQL"]
    candidate_text = "Experienced full stack software engineer working with Python, FastAPI backend microservices and React web frontends with PostgreSQL database."
    job_required = ["Python", "FastAPI", "PostgreSQL"]
    job_preferred = ["Docker", "Kubernetes"]
    job_desc = "Looking for a Python FastAPI developer with PostgreSQL experience and container knowledge."

    result = CandidateMatcher.match_candidate_to_job(
        candidate_skills=candidate_skills,
        candidate_resume_text=candidate_text,
        job_required_skills=job_required,
        job_preferred_skills=job_preferred,
        job_description_text=job_desc
    )

    assert result["match_score"] > 70.0
    assert "Python" in result["matched_skills"]
    assert "FastAPI" in result["matched_skills"]
    assert "Kubernetes" in result["missing_skills"]
    assert result["fit_level"] in ["Excellent Fit", "Good Fit"]

def test_cosine_similarity():
    text1 = "FastAPI Python backend web development"
    text2 = "Python backend developer specializing in FastAPI"
    sim = CandidateMatcher.compute_cosine_similarity(text1, text2)
    assert sim > 0.4
