import uuid
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.utils.security import hash_password, create_access_token

client = TestClient(app)

def test_interview_requires_resume():
    db = SessionLocal()
    unique_email = f"test_cand_{uuid.uuid4().hex[:8]}@aihire.com"
    
    try:
        # Create candidate user without resume
        cand_user = User(
            name="Test Candidate",
            email=unique_email,
            password_hash=hash_password("password123"),
            role="candidate"
        )
        db.add(cand_user)
        db.commit()
        db.refresh(cand_user)

        candidate = Candidate(
            user_id=cand_user.id,
            resume_filename="",
            resume_text=""
        )
        db.add(candidate)

        # Fetch any existing job
        job = db.query(Job).first()
        db.commit()

        token = create_access_token({"sub": cand_user.email, "role": "candidate"})

        # 1. Attempt to create interview without resume -> Expect 400 Bad Request
        response = client.post(
            "/api/interviews",
            json={"job_id": job.id, "mode": "text"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 400
        assert "resume required" in response.json()["detail"].lower()

        # 2. Add resume to candidate
        candidate.resume_filename = "test_resume.pdf"
        candidate.resume_text = "Proficient in Python, Fast API and Machine Learning."
        candidate.extracted_skills = json.dumps(["Python", "Machine Learning"])
        db.commit()

        # 3. Attempt to create interview with resume -> Expect 200 OK
        response_with_resume = client.post(
            "/api/interviews",
            json={"job_id": job.id, "mode": "text"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response_with_resume.status_code == 200
        data = response_with_resume.json()
        assert "id" in data
        assert data["job_id"] == job.id

    finally:
        db.close()
