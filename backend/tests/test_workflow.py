import os
import io
import sys
import json
import uuid
import pytest
from datetime import date, datetime, timedelta

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.connection import Base, get_db
from app import app

# Setup local SQLite test database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///C:/Users/dhruv/Desktop/Atlas_HR_project/backend/atlas.db")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def get_token_for_user(email: str) -> str:
    """Helper to authenticate and get JWT token."""
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"}
    )
    assert response.status_code == 200
    return response.json()["token"]


PDF_BYTES = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n%%EOF"


def get_submittable_applicant_payload():
    """A complete, submittable application (personal + professional + declaration)."""
    unique = uuid.uuid4().hex[:8]
    return {
        "personal_details": {
            "first_name": "TestCandidate",
            "last_name": "Workflow",
            "email": f"workflow.{unique}@example.com",
            "phone": "9998887770",
            "gender": "MALE",
            "date_of_birth": "1994-08-20",
            "current_address": "456 Workflow lane",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "pincode": "411001"
        },
        "professional_details": {
            "current_company": "Startup Corp",
            "current_designation": "Developer",
            "total_experience": 2.5,
            "relevant_experience": 2.0,
            "employment_type": "FULL_TIME"
        },
        "declaration": {
            "declaration_accepted": True,
            "consent_accepted": True,
            "signed_date": str(date.today())
        }
    }


def submit_candidate(payload):
    """Atomic multipart submit of a full application (browser-side wizard,
    single record on final submit — there is no server-side draft)."""
    files = {"signature": ("sig.pdf", PDF_BYTES, "application/pdf")}
    return client.post("/api/applicant", data={"payload": json.dumps(payload)}, files=files)


def test_complete_ats_workflow():
    # 1. Submit a complete application in one atomic multipart POST (Public).
    #    The multi-step form is filled in the browser; ONE record is created on
    #    final submit with status "Submitted — awaiting reception".
    payload = get_submittable_applicant_payload()
    submit_resp = submit_candidate(payload)
    assert submit_resp.status_code == 201, submit_resp.text
    candidate_id = submit_resp.json()["data"]["candidate_id"]
    assert submit_resp.json()["data"]["status"] == "Submitted — awaiting reception"

    # --- RECEPTIONIST STAGE ---
    reception_token = get_token_for_user("reception@atlas.com")
    headers = {"Authorization": f"Bearer {reception_token}"}
    
    # Receptionist can view and edit details
    get_resp = client.get(f"/api/applicant/{candidate_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["first_name"] == "TestCandidate"
    
    # Receptionist updates candidate pincode
    reception_edit_payload = {
        "personal_details": {
            **payload["personal_details"],
            "pincode": "411002"
        }
    }
    edit_resp = client.put(f"/api/applicant/{candidate_id}", json=reception_edit_payload, headers=headers)
    assert edit_resp.status_code == 200
    assert edit_resp.json()["data"]["pincode"] == "411002"
    
    # Receptionist forwards to HR
    forward_resp = client.post(f"/api/workflow/receptionist/forward/{candidate_id}", headers=headers)
    assert forward_resp.status_code == 200
    assert forward_resp.json()["data"]["status"] == "RECEPTION_FORWARDED"

    # --- HR ADMIN REVIEW STAGE ---
    hr_token = get_token_for_user("hr.admin@atlas.com")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    
    # HR review candidate, defines 2 technical rounds, assigns Round 1 to l1.panel@atlas.com
    hr_review_payload = {
        "domain": "Node Backend",
        "number_of_tech_rounds": 2,
        "hr_status": "SELECT",
        "first_interviewer_email": "l1.panel@atlas.com"
    }
    hr_review_resp = client.post(
        f"/api/workflow/hr/review/{candidate_id}",
        json=hr_review_payload,
        headers=hr_headers
    )
    assert hr_review_resp.status_code == 200
    assert hr_review_resp.json()["data"]["status"] == "TECH_ROUND_1"

    # HR cannot edit candidate details (Sections 1-8). PUT is staff-only and
    # requires candidate.update / candidate.update_any; HR_ADMIN has neither.
    hr_edit_resp = client.put(f"/api/applicant/{candidate_id}", json=reception_edit_payload, headers=hr_headers)
    assert hr_edit_resp.status_code == 403  # Lacks candidate.update permission

    # --- TECHNICAL INTERVIEW ROUND 1 ---
    l1_token = get_token_for_user("l1.panel@atlas.com")
    l1_headers = {"Authorization": f"Bearer {l1_token}"}
    
    # L1 interviewer checks candidate profile
    # Verify L1 can see candidate details, but NOT HR internal assessments or future rounds
    l1_get_resp = client.get(f"/api/applicant/{candidate_id}", headers=l1_headers)
    assert l1_get_resp.status_code == 200
    l1_cand_data = l1_get_resp.json()["data"]
    assert "activity_logs" not in l1_cand_data or len(l1_cand_data["activity_logs"]) == 0
    assert "final_decision" not in l1_cand_data or l1_cand_data["final_decision"] is None
    
    # L1 submits evaluation, forwards to Round 2 (l2.panel@atlas.com)
    l1_eval_payload = {
        "status_selection": "COMPLETED",
        "remarks": "Excellent JavaScript & SQL skills",
        "evaluation_data": {"coding_score": 9, "system_design": 8},
        "next_interviewer_email": "l2.panel@atlas.com"
    }
    l1_eval_resp = client.post(
        f"/api/workflow/technical/evaluate/{candidate_id}/1",
        json=l1_eval_payload,
        headers=l1_headers
    )
    assert l1_eval_resp.status_code == 200
    assert l1_eval_resp.json()["data"]["status"] == "COMPLETED"
    
    # Verify status changed to TECH_ROUND_2
    l1_get_resp2 = client.get(f"/api/applicant/{candidate_id}", headers=l1_headers)
    assert l1_get_resp2.json()["data"]["status"] == "TECH_ROUND_2"

    # --- TECHNICAL INTERVIEW ROUND 2 (Last Round) ---
    l2_token = get_token_for_user("l2.panel@atlas.com")
    l2_headers = {"Authorization": f"Bearer {l2_token}"}
    
    # L2 interviewer submits evaluation. Since total rounds is 2, this forwards to CEO_ROUND automatically.
    l2_eval_payload = {
        "status_selection": "COMPLETED",
        "remarks": "Strong architectural insights",
        "evaluation_data": {"architecture": 8.5},
        "next_interviewer_email": None
    }
    l2_eval_resp = client.post(
        f"/api/workflow/technical/evaluate/{candidate_id}/2",
        json=l2_eval_payload,
        headers=l2_headers
    )
    assert l2_eval_resp.status_code == 200
    assert l2_eval_resp.json()["data"]["status"] == "COMPLETED"

    # --- CEO / SYSTEM ADMIN ROUND ---
    admin_token = get_token_for_user("admin@atlas.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # CEO/Admin gets candidate profile (should see ALL rounds history & activity logs)
    ceo_get_resp = client.get(f"/api/applicant/{candidate_id}", headers=admin_headers)
    assert ceo_get_resp.status_code == 200
    ceo_cand_data = ceo_get_resp.json()["data"]
    assert len(ceo_cand_data["activity_logs"]) > 0
    assert len(ceo_cand_data["interview_rounds"]) == 4  # HR Review, Tech R1, Tech R2, and CEO PENDING round
    
    # CEO submits review (save_draft = False)
    ceo_eval_payload = {
        "remarks": "Outstanding candidate fit. Approved for selection.",
        "evaluation_data": {"leadership_score": 10},
        "save_draft": False
    }
    ceo_eval_resp = client.post(
        f"/api/workflow/ceo/evaluate/{candidate_id}",
        json=ceo_eval_payload,
        headers=admin_headers
    )
    assert ceo_eval_resp.status_code == 200
    assert ceo_eval_resp.json()["data"]["status"] == "COMPLETED"

    # --- FINAL DECISION ---
    # Submit final decision details: SELECTED, 1,500,000 CTC
    fd_payload = {
        "final_status": "SELECTED",
        "offered_ctc": 1500000.0,
        "joining_date": str(date.today() + timedelta(days=30)),
        "final_remarks": "Hired as Senior Software Engineer"
    }
    fd_resp = client.post(
        f"/api/workflow/final-decision/{candidate_id}",
        json=fd_payload,
        headers=admin_headers
    )
    assert fd_resp.status_code == 200
    assert fd_resp.json()["data"]["final_status"] == "SELECTED"
    
    # Get applicant profile to confirm final status is SELECTED
    final_get_resp = client.get(f"/api/applicant/{candidate_id}", headers=admin_headers)
    assert final_get_resp.json()["data"]["status"] == "SELECTED"


def test_rbac_violations():
    payload = get_submittable_applicant_payload()
    create_resp = submit_candidate(payload)
    assert create_resp.status_code == 201, create_resp.text
    candidate_id = create_resp.json()["data"]["candidate_id"]

    reception_token = get_token_for_user("reception@atlas.com")
    headers = {"Authorization": f"Bearer {reception_token}"}
    
    # Receptionist cannot evaluate technical rounds
    resp = client.post(
        f"/api/workflow/technical/evaluate/{candidate_id}/1",
        json={"status_selection": "COMPLETED", "remarks": "No permission"},
        headers=headers
    )
    assert resp.status_code == 403
    
    # Unauthenticated requests are rejected on protected workflow endpoints
    resp2 = client.post(f"/api/workflow/receptionist/forward/{candidate_id}")
    assert resp2.status_code == 401
