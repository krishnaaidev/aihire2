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

def test_complete_interview_flow_all_five_questions():
    db = SessionLocal()
    unique_email = f"test_cand_full_{uuid.uuid4().hex[:8]}@aihire.com"
    try:
        cand_user = User(
            name="Full Flow Candidate",
            email=unique_email,
            password_hash=hash_password("password123"),
            role="candidate"
        )
        db.add(cand_user)
        db.commit()
        db.refresh(cand_user)

        candidate = Candidate(
            user_id=cand_user.id,
            resume_filename="ml_resume.pdf",
            resume_text="Senior Machine Learning Engineer with 4 years experience in Python, PyTorch, Scikit-Learn, and Docker.",
            extracted_skills=json.dumps(["Python", "PyTorch", "Scikit-Learn", "Machine Learning", "Docker"])
        )
        db.add(candidate)
        job = db.query(Job).first()
        db.commit()

        token = create_access_token({"sub": cand_user.email, "role": "candidate"})

        # Start interview
        create_res = client.post(
            "/api/interviews",
            json={"job_id": job.id, "mode": "text"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert create_res.status_code == 200
        int_data = create_res.json()
        interview_id = int_data["id"]

        # Get initial interview details
        get_res = client.get(
            f"/api/interviews/{interview_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_res.status_code == 200
        cur_interview = get_res.json()
        assert len(cur_interview["questions"]) >= 1

        # Submit answers sequentially for 5 questions
        for q_num in range(1, 6):
            # Fetch current question
            interview_state = client.get(
                f"/api/interviews/{interview_id}",
                headers={"Authorization": f"Bearer {token}"}
            ).json()

            current_idx = interview_state["current_question_index"]
            assert current_idx == q_num - 1
            active_q = interview_state["questions"][current_idx]

            ans_payload = {
                "interview_id": interview_id,
                "question_id": active_q["id"],
                "answer": f"For {active_q['question_text']}, I prevent unnecessary re-renders using React.memo and useCallback, manage side-effects with dedicated hooks, and adhere strictly to WCAG guidelines by adding semantic aria-labels and keyboard navigation.",
                "transcript": ""
            }

            ans_res = client.post(
                f"/api/interviews/{interview_id}/answer",
                json=ans_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert ans_res.status_code == 200, f"Failed on question {q_num}: {ans_res.text}"
            res_json = ans_res.json()

            if q_num < 5:
                assert res_json["completed"] is False
                assert res_json["next_question"] is not None
                assert res_json["current_index"] == q_num
            else:
                # 5th question MUST complete the interview smoothly
                assert res_json["completed"] is True
                assert res_json["total_questions"] == 5
                assert res_json["current_index"] == 5

        # Verify interview status is now completed
        final_state = client.get(
            f"/api/interviews/{interview_id}",
            headers={"Authorization": f"Bearer {token}"}
        ).json()
        assert final_state["status"] == "completed"

        # Verify Report was generated and accessible
        report_res = client.get(
            f"/api/reports/interview/{interview_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert report_res.status_code == 200
        report_data = report_res.json()
        assert report_data["overall_score"] > 0
        assert report_data["recommendation"] in ["Strong Hire", "Hire", "Lean Hire", "Consider", "Do Not Hire"]

        # Retry submitting on completed interview -> should gracefully return completed=True
        retry_res = client.post(
            f"/api/interviews/{interview_id}/answer",
            json=ans_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert retry_res.status_code == 200
        assert retry_res.json()["completed"] is True

    finally:
        db.close()


