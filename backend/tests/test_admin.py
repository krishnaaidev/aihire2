import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password, create_access_token

client = TestClient(app)

def test_admin_endpoints_protection_and_access():
    db = SessionLocal()
    try:
        # Create test users
        admin = db.query(User).filter(User.email == "test_admin@aihire.com").first()
        if not admin:
            admin = User(
                name="Test Admin",
                email="test_admin@aihire.com",
                password_hash=hash_password("adminpass123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        candidate = db.query(User).filter(User.email == "test_cand_auth@aihire.com").first()
        if not candidate:
            candidate = User(
                name="Test Cand",
                email="test_cand_auth@aihire.com",
                password_hash=hash_password("candpass123"),
                role="candidate"
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        admin_token = create_access_token({"sub": admin.email, "role": admin.role, "id": admin.id})
        cand_token = create_access_token({"sub": candidate.email, "role": candidate.role, "id": candidate.id})

        # 1. Non-admin forbidden
        res_cand = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {cand_token}"})
        assert res_cand.status_code == 403

        # 2. Admin allowed metrics
        res_admin = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_admin.status_code == 200
        metrics = res_admin.json()
        assert "total_candidates" in metrics
        assert "total_recruiters" in metrics
        assert "total_jobs" in metrics

        # 3. Admin candidates list
        res_cands = client.get("/api/admin/candidates", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_cands.status_code == 200
        assert isinstance(res_cands.json(), list)

        # 4. Admin recruiters list
        res_recs = client.get("/api/admin/recruiters", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_recs.status_code == 200
        assert isinstance(res_recs.json(), list)

        # 5. Admin interviews list
        res_ivs = client.get("/api/admin/interviews", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_ivs.status_code == 200
        assert isinstance(res_ivs.json(), list)

        # 6. Admin CSV export
        res_csv = client.get("/api/admin/export/candidates", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]

    finally:
        db.close()
