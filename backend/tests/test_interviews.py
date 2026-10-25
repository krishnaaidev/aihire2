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
        interview_id = data["id"]

        # 4. Test Proctoring Event Logging
        proc_res = client.post(
            f"/api/interviews/{interview_id}/proctoring-event",
            json={"event_type": "tab_switch", "details": "Candidate switched tabs"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert proc_res.status_code == 200
        proc_data = proc_res.json()
        assert proc_data["tab_switches"] == 1
        assert proc_data["integrity_score"] == 92.0 # 100 - 8

        # Log paste attempt
        proc_paste_res = client.post(
            f"/api/interviews/{interview_id}/proctoring-event",
            json={"event_type": "paste_attempt", "details": "Blocked clipboard paste"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert proc_paste_res.status_code == 200
        assert proc_paste_res.json()["paste_count"] == 1
        assert proc_paste_res.json()["integrity_score"] == 88.0 # 92 - 4

        # 5. Test Recruiter Status Update
        rec_user = db.query(User).filter(User.role == "recruiter").first()
        rec_email = rec_user.email if rec_user else cand_user.email
        rec_token = create_access_token({"sub": rec_email, "role": "recruiter"})
        status_res = client.patch(
            f"/api/interviews/{interview_id}/status",
            json={"recruiter_status": "Shortlisted"},
            headers={"Authorization": f"Bearer {rec_token}"}
        )
        assert status_res.status_code == 200
        assert status_res.json()["recruiter_status"] == "Shortlisted"

        # 6. Test CSV Export
        csv_res = client.get(f"/api/interviews/job/{job.id}/export-csv")
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "AIHire_Candidates" in csv_res.headers["content-disposition"]
        assert "Candidate Name" in csv_res.text
        assert "Test Candidate" in csv_res.text
        assert "Shortlisted" in csv_res.text

        # 7. Test Face Visibility & Object/Movement Malpractice Auto-Cancellation
        cancel_res = client.post(
            f"/api/interviews/{interview_id}/cancel",
            json={
                "reason": "Candidate face was not visible in camera preview for 3 consecutive warnings.",
                "violation_type": "proctoring_malpractice",
                "permanent_disqualification": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert cancel_res.status_code == 200
        cancel_data = cancel_res.json()
        assert cancel_data["status"] == "cancelled"
        assert "Rejected" in cancel_data["recruiter_status"]
        assert cancel_data["integrity_score"] == 0.0

        # 8. Test Retake Prohibition: Candidate cannot create interview again for this job
        retake_res = client.post(
            "/api/interviews",
            json={"job_id": job.id, "mode": "text"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert retake_res.status_code == 403
        assert "permanently cancelled" in retake_res.json()["detail"].lower()

    finally:
        db.close()

@pytest.mark.anyio
async def test_adaptive_question_generation_on_candidate_reply():
    from app.services.question_generator import QuestionGenerator
    
    # Candidate mentions Docker and Redis caching
    candidate_reply = "I used Docker containers with Kubernetes, and implemented a Redis caching layer for fast key-value lookups."
    
    next_question = await QuestionGenerator.generate_adaptive_question_on_topic(
        job_title="Backend Engineer",
        required_skills=["Python", "Docker", "Redis"],
        candidate_skills=["Python", "FastAPI"],
        previous_question="Describe how you architected your recent distributed web service.",
        candidate_answer=candidate_reply,
        order_index=2
    )
    
    assert next_question is not None
    assert "question_text" in next_question
    assert "category" in next_question
    # The generated question should reference or build upon concepts from the candidate's answer
    q_lower = next_question["question_text"].lower()
    assert any(term in q_lower for term in ["redis", "caching", "docker", "kubernetes", "database", "latency", "ttl", "memory", "storage"])

