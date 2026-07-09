"""
Applicant Form Intake Module — Comprehensive Test Suite

Candidate intake is now a SINGLE atomic multipart submit. The multi-step form
is filled entirely in the browser; there is no server-side DRAFT. One record is
created on final submit via:

    POST /api/applicant   (alias /api/applicants)
      multipart/form-data:
        payload   = JSON string of the full application (all sections)
        signature = a PDF file (bytes must start with %PDF-)

Test Categories:
  1. Submission Tests (the atomic multipart create)
  2. Read / List / Update Tests (staff-only)
  3. Validation Tests (all field-level validators)
  4. Negative Tests (error cases)
  5. Database Tests (relationships, cascades)
  6. File Upload Tests (PDF lands on disk)

Usage:
  python3 -m pytest tests/test_applicant_api.py -v
"""

import os
import io
import sys
import json
import uuid
import pytest
from datetime import date, timedelta

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.connection import Base, get_db, SessionLocal
from services.applicant_service import SUBMITTED_STATUS
from app import app

# ---------------------------------------------------------------------------
# Test Database Setup
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dhruv@localhost:5432/postgres")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Import models to ensure tables are created
from models.applicant import *  # noqa: F401,F403
Base.metadata.create_all(bind=engine)

client = TestClient(app)


# ---------------------------------------------------------------------------
# A minimal but valid PDF (bytes MUST start with %PDF-).
# ---------------------------------------------------------------------------

PDF_BYTES = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n%%EOF"


def submit_application(
    payload_dict,
    signature_bytes=PDF_BYTES,
    filename="sig.pdf",
    content_type="application/pdf",
    with_signature=True,
):
    """Perform the atomic multipart submit of a full application.

    Passing with_signature=False omits the file field entirely (FastAPI then
    returns 422 for the missing required File).
    """
    data = {"payload": json.dumps(payload_dict)}
    if with_signature:
        files = {"signature": (filename, signature_bytes, content_type)}
        return client.post("/api/applicant", data=data, files=files)
    return client.post("/api/applicant", data=data)


# ---------------------------------------------------------------------------
# Authentication helper — GET/{id}, LIST and PUT require a staff Bearer token.
# ---------------------------------------------------------------------------

def get_auth_headers(email: str = "admin@atlas.com", password: str = "password123"):
    """Log in a seeded staff user and return an Authorization header dict."""
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Test Data Fixtures
# ---------------------------------------------------------------------------

def get_valid_applicant_payload():
    """Return a complete, submittable applicant payload.

    Must include professional_details and an accepted declaration so that the
    atomic submit succeeds.
    """
    unique = uuid.uuid4().hex[:8]
    return {
        "personal_details": {
            "first_name": "John",
            "middle_name": "Michael",
            "last_name": "Doe",
            "email": f"john.doe.{unique}@example.com",
            "phone": "9876543210",
            "alternate_phone": "9123456780",
            "gender": "MALE",
            "date_of_birth": "1995-06-15",
            "current_address": "123 Test Street, Block A",
            "permanent_address": "456 Home Street, Block B",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "pincode": "400001"
        },
        "professional_details": {
            "current_company": "Tech Corp",
            "current_designation": "Senior Developer",
            "total_experience": 5.5,
            "relevant_experience": 4.0,
            "current_ctc": 1200000,
            "expected_ctc": 1800000,
            "notice_period": "30 days",
            "joining_availability": "Immediate",
            "preferred_location": "Mumbai",
            "employment_type": "FULL_TIME"
        },
        "employment_history": [
            {
                "company_name": "Previous Corp",
                "designation": "Developer",
                "start_date": "2019-01-01",
                "end_date": "2022-12-31",
                "responsibilities": "Full stack development and team management",
                "reason_for_leaving": "Career growth"
            },
            {
                "company_name": "First Corp",
                "designation": "Junior Developer",
                "start_date": "2017-06-01",
                "end_date": "2018-12-31",
                "responsibilities": "Frontend development",
                "reason_for_leaving": "Better opportunity"
            }
        ],
        "education": [
            {
                "qualification": "B.Tech",
                "institution_name": "IIT Mumbai",
                "university": "IIT Mumbai",
                "passing_year": 2017,
                "percentage": 85.5,
                "grade": "A",
                "specialization": "Computer Science"
            },
            {
                "qualification": "HSC",
                "institution_name": "Delhi Public School",
                "university": "CBSE",
                "passing_year": 2013,
                "percentage": 92.0,
                "grade": "A+",
                "specialization": "Science"
            }
        ],
        "personality_assessment": [
            {"question_number": 1, "rating": 4},
            {"question_number": 2, "rating": 5},
            {"question_number": 3, "rating": 3},
        ],
        "situational_responses": [
            {"question_number": 1, "selected_option": "A"},
            {"question_number": 2, "selected_option": "C"},
            {"question_number": 3, "selected_option": "B"},
        ],
        "written_responses": [
            {
                "question_number": 1,
                "answer_text": "I believe in continuous learning and self-improvement in the workplace."
            },
            {
                "question_number": 2,
                "answer_text": "My greatest professional achievement was leading a team of developers to deliver a critical project ahead of schedule."
            }
        ],
        "declaration": {
            "declaration_accepted": True,
            "consent_accepted": True,
            "signed_date": str(date.today())
        }
    }


def get_minimal_applicant_payload():
    """Return a payload with only Section 1 (personal details).

    This is deliberately NOT submittable — it is missing professional_details
    and the declaration — so it is used to exercise the submit-time required
    section validation.
    """
    unique = uuid.uuid4().hex[:8]
    return {
        "personal_details": {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": f"jane.smith.{unique}@example.com",
            "phone": "9876543210",
            "gender": "FEMALE",
            "date_of_birth": "1998-03-20",
            "current_address": "789 Minimal Street",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "pincode": "110001"
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 1. SUBMISSION TESTS (the atomic multipart create)
# ═══════════════════════════════════════════════════════════════════════════════

class TestSubmitApplication:
    """Tests for POST /api/applicant (alias /api/applicants)."""

    def test_valid_submit_creates_submitted_record(self):
        """A complete payload + PDF creates ONE submitted record with all sections."""
        payload = get_valid_applicant_payload()
        response = submit_application(payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == SUBMITTED_STATUS
        assert data["data"]["status"] == "Submitted — awaiting reception"
        assert data["data"]["application_number"].startswith("ATLAS-APP-")
        assert data["data"]["candidate_id"]
        assert data["data"]["first_name"] == "John"
        assert data["data"]["professional_details"] is not None
        assert len(data["data"]["employment_history"]) == 2
        assert len(data["data"]["education"]) == 2
        assert len(data["data"]["personality_assessment"]) == 3
        assert len(data["data"]["situational_responses"]) == 3
        assert len(data["data"]["written_responses"]) == 2
        assert data["data"]["declaration"] is not None

    def test_alias_endpoint_works(self):
        """The /api/applicants alias accepts the same multipart submit."""
        payload = get_valid_applicant_payload()
        files = {"signature": ("sig.pdf", PDF_BYTES, "application/pdf")}
        response = client.post(
            "/api/applicants",
            data={"payload": json.dumps(payload)},
            files=files,
        )
        assert response.status_code == 201, response.text
        assert response.json()["data"]["status"] == SUBMITTED_STATUS

    def test_missing_professional_details_fails(self):
        """Submit without Section 2 (professional_details) → 400."""
        payload = get_minimal_applicant_payload()
        payload["declaration"] = {
            "declaration_accepted": True,
            "consent_accepted": True,
            "signed_date": str(date.today()),
        }
        response = submit_application(payload)
        assert response.status_code == 400

    def test_missing_declaration_fails(self):
        """Submit without a declaration → 400."""
        payload = get_valid_applicant_payload()
        del payload["declaration"]
        response = submit_application(payload)
        assert response.status_code == 400

    def test_declaration_not_accepted_fails(self):
        """declaration_accepted False → 400."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["declaration_accepted"] = False
        response = submit_application(payload)
        assert response.status_code == 400

    def test_consent_not_accepted_fails(self):
        """consent_accepted False → 400."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["consent_accepted"] = False
        response = submit_application(payload)
        assert response.status_code == 400

    def test_non_pdf_signature_rejected(self):
        """A signature file whose bytes are not %PDF- → 400."""
        payload = get_valid_applicant_payload()
        response = submit_application(
            payload,
            signature_bytes=b"This is a text file, not a PDF",
            filename="sig.txt",
            content_type="text/plain",
        )
        assert response.status_code == 400

    def test_empty_signature_rejected(self):
        """An empty signature file → 400."""
        payload = get_valid_applicant_payload()
        response = submit_application(payload, signature_bytes=b"")
        assert response.status_code == 400

    def test_missing_signature_file_rejected(self):
        """Omitting the required signature File → 422."""
        payload = get_valid_applicant_payload()
        response = submit_application(payload, with_signature=False)
        assert response.status_code == 422

    def test_oversized_signature_rejected(self):
        """A signature larger than 5 MB → 413."""
        payload = get_valid_applicant_payload()
        large_content = b"%PDF-1.4\n" + (b"x" * (6 * 1024 * 1024))
        response = submit_application(payload, signature_bytes=large_content)
        assert response.status_code == 413

    def test_duplicate_email_fails(self):
        """Re-submitting with an already used email → 400."""
        payload = get_valid_applicant_payload()
        first = submit_application(payload)
        assert first.status_code == 201

        # Same email again (mutate a non-key field so only the email collides).
        again = submit_application(payload)
        assert again.status_code == 400

    def test_invalid_payload_json_rejected(self):
        """A non-JSON / unparseable payload → 422."""
        files = {"signature": ("sig.pdf", PDF_BYTES, "application/pdf")}
        response = client.post(
            "/api/applicant",
            data={"payload": "this-is-not-json"},
            files=files,
        )
        assert response.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# 2. READ / LIST / UPDATE TESTS (staff-only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetApplicant:
    """Tests for GET /api/applicant(s)/{id} — staff-only."""

    def test_get_existing_applicant(self):
        """Staff can read the full submitted record."""
        payload = get_valid_applicant_payload()
        submit_resp = submit_application(payload)
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        headers = get_auth_headers()
        response = client.get(f"/api/applicants/{applicant_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["applicant_id"] == applicant_id

    def test_anonymous_get_rejected_staff_get_allowed(self):
        """There is no anonymous draft-read anymore: anonymous GET is rejected,
        staff GET works."""
        payload = get_valid_applicant_payload()
        submit_resp = submit_application(payload)
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        # Anonymous read is rejected (no more public capability-URL draft read).
        anon_resp = client.get(f"/api/applicants/{applicant_id}")
        assert anon_resp.status_code in (401, 403)

        # Staff can read it.
        headers = get_auth_headers()
        staff_resp = client.get(f"/api/applicants/{applicant_id}", headers=headers)
        assert staff_resp.status_code == 200
        assert staff_resp.json()["data"]["status"] == SUBMITTED_STATUS

    def test_get_nonexistent_applicant(self):
        """Should return 404 for non-existent ID."""
        fake_id = str(uuid.uuid4())
        headers = get_auth_headers()
        response = client.get(f"/api/applicants/{fake_id}", headers=headers)
        assert response.status_code == 404

    def test_get_invalid_id_format(self):
        """Should return 400 for invalid UUID format."""
        headers = get_auth_headers()
        response = client.get("/api/applicants/not-a-uuid", headers=headers)
        assert response.status_code == 400


class TestListApplicants:
    """Tests for GET /api/applicants — staff-only."""

    def test_list_requires_authentication(self):
        """Should reject anonymous list requests."""
        response = client.get("/api/applicants")
        assert response.status_code in (401, 403)

    def test_list_applicants(self):
        """Should return a paginated list (staff auth required)."""
        headers = get_auth_headers()
        response = client.get("/api/applicants", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "total" in data
        assert "applicants" in data

    def test_list_with_pagination(self):
        """Should respect skip and limit parameters."""
        headers = get_auth_headers()
        response = client.get("/api/applicants?skip=0&limit=5", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["skip"] == 0

    def test_list_with_status_filter(self):
        """Should filter by the submitted status."""
        # Ensure at least one submitted record exists.
        submit_application(get_valid_applicant_payload())

        headers = get_auth_headers()
        response = client.get(
            "/api/applicants",
            params={"status": SUBMITTED_STATUS},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        for app_row in data["applicants"]:
            assert app_row["status"] == SUBMITTED_STATUS


class TestUpdateApplicant:
    """Tests for PUT /api/applicant(s)/{id} — staff-only."""

    def test_receptionist_can_edit_freshly_submitted(self):
        """A freshly submitted record is within the receptionist pre-arrival
        window, so a receptionist (candidate.update) may edit it."""
        submit_resp = submit_application(get_valid_applicant_payload())
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        headers = get_auth_headers("reception@atlas.com")
        unique = uuid.uuid4().hex[:8]
        update_payload = {
            "personal_details": {
                "first_name": "Jane Updated",
                "last_name": "Smith Updated",
                "email": f"jane.updated.{unique}@example.com",
                "phone": "9988776655",
                "gender": "FEMALE",
                "date_of_birth": "1998-03-20",
                "current_address": "Updated Address 789",
                "city": "Bangalore",
                "state": "Karnataka",
                "country": "India",
                "pincode": "560001"
            }
        }
        response = client.put(
            f"/api/applicants/{applicant_id}", json=update_payload, headers=headers
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["data"]["first_name"] == "Jane Updated"
        assert data["data"]["city"] == "Bangalore"

    def test_admin_can_replace_sections(self):
        """SYSTEM_ADMIN (candidate.update_any) may replace sections."""
        submit_resp = submit_application(get_valid_applicant_payload())
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        headers = get_auth_headers("admin@atlas.com")
        update_payload = {
            "professional_details": {
                "current_company": "New Corp",
                "current_designation": "Manager",
                "total_experience": 3.0,
                "relevant_experience": 2.0,
                "employment_type": "FULL_TIME"
            },
            "personality_assessment": [
                {"question_number": 1, "rating": 5}
            ]
        }
        response = client.put(
            f"/api/applicants/{applicant_id}", json=update_payload, headers=headers
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["data"]["professional_details"]["current_company"] == "New Corp"
        assert len(data["data"]["personality_assessment"]) == 1

    def test_update_requires_authentication(self):
        """Anonymous PUT is rejected (staff-only endpoint)."""
        submit_resp = submit_application(get_valid_applicant_payload())
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        response = client.put(
            f"/api/applicants/{applicant_id}", json={"personal_details": None}
        )
        assert response.status_code in (401, 403)

    def test_read_only_role_cannot_update(self):
        """A user with only candidate.read (HR_PANEL) is forbidden → 403."""
        submit_resp = submit_application(get_valid_applicant_payload())
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        headers = get_auth_headers("hr.panel@atlas.com")
        response = client.put(
            f"/api/applicants/{applicant_id}",
            json={"personal_details": None},
            headers=headers,
        )
        assert response.status_code == 403

    def test_update_nonexistent_fails(self):
        """Should return 404 for non-existent applicant (with staff auth)."""
        fake_id = str(uuid.uuid4())
        headers = get_auth_headers("reception@atlas.com")
        response = client.put(
            f"/api/applicants/{fake_id}",
            json={"personal_details": None},
            headers=headers,
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 3. VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidation:
    """Tests for all field-level validators (schema violations → 422)."""

    def test_invalid_email(self):
        """Should reject invalid email format."""
        payload = get_valid_applicant_payload()
        payload["personal_details"]["email"] = "not-an-email"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_phone_not_10_digits(self):
        """Should reject phone numbers that are not 10 digits."""
        payload = get_valid_applicant_payload()
        payload["personal_details"]["phone"] = "12345"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_future_date_of_birth(self):
        """Should reject future date of birth."""
        payload = get_valid_applicant_payload()
        future_date = (date.today() + timedelta(days=365)).isoformat()
        payload["personal_details"]["date_of_birth"] = future_date
        response = submit_application(payload)
        assert response.status_code == 422

    def test_invalid_gender(self):
        """Should reject invalid gender values."""
        payload = get_valid_applicant_payload()
        payload["personal_details"]["gender"] = "INVALID"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_negative_ctc(self):
        """Should reject negative CTC values."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["current_ctc"] = -50000
        response = submit_application(payload)
        assert response.status_code == 422

    def test_negative_experience(self):
        """Should reject negative experience values."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["total_experience"] = -1
        response = submit_application(payload)
        assert response.status_code == 422

    def test_invalid_passing_year_too_old(self):
        """Should reject passing year before 1900."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["passing_year"] = 1800
        response = submit_application(payload)
        assert response.status_code == 422

    def test_invalid_passing_year_future(self):
        """Should reject passing year in the future."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["passing_year"] = date.today().year + 5
        response = submit_application(payload)
        assert response.status_code == 422

    def test_rating_below_1(self):
        """Should reject ratings below 1."""
        payload = get_valid_applicant_payload()
        payload["personality_assessment"][0]["rating"] = 0
        response = submit_application(payload)
        assert response.status_code == 422

    def test_rating_above_5(self):
        """Should reject ratings above 5."""
        payload = get_valid_applicant_payload()
        payload["personality_assessment"][0]["rating"] = 6
        response = submit_application(payload)
        assert response.status_code == 422

    def test_invalid_scenario_option(self):
        """Should reject options other than A, B, C, D."""
        payload = get_valid_applicant_payload()
        payload["situational_responses"][0]["selected_option"] = "E"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_answer_too_short(self):
        """Should reject written answers shorter than 20 characters."""
        payload = get_valid_applicant_payload()
        payload["written_responses"][0]["answer_text"] = "Too short"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_answer_too_long(self):
        """Should reject written answers longer than 2000 characters."""
        payload = get_valid_applicant_payload()
        payload["written_responses"][0]["answer_text"] = "x" * 2001
        response = submit_application(payload)
        assert response.status_code == 422

    def test_invalid_employment_type(self):
        """Should reject invalid employment type."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["employment_type"] = "INVALID_TYPE"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_employment_end_before_start(self):
        """Should reject employment end date before start date."""
        payload = get_valid_applicant_payload()
        payload["employment_history"][0]["start_date"] = "2023-01-01"
        payload["employment_history"][0]["end_date"] = "2020-01-01"
        response = submit_application(payload)
        assert response.status_code == 422

    def test_percentage_above_100(self):
        """Should reject percentage above 100."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["percentage"] = 105.0
        response = submit_application(payload)
        assert response.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# 4. NEGATIVE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestNegativeCases:
    """Edge cases and error scenarios."""

    def test_empty_payload(self):
        """Should reject an empty payload object (missing personal_details) → 422."""
        response = submit_application({})
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Should reject payload missing required personal details fields → 422."""
        payload = {
            "personal_details": {
                "first_name": "Test"
                # Missing all other required fields
            }
        }
        response = submit_application(payload)
        assert response.status_code == 422

    def test_submit_without_declaration(self):
        """Should fail submission if declaration is missing → 400."""
        payload = get_valid_applicant_payload()
        del payload["declaration"]
        response = submit_application(payload)
        assert response.status_code == 400

    def test_submit_with_false_declaration(self):
        """Should fail if declaration_accepted is False → 400."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["declaration_accepted"] = False
        response = submit_application(payload)
        assert response.status_code == 400

    def test_submit_with_false_consent(self):
        """Should fail if consent_accepted is False → 400."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["consent_accepted"] = False
        response = submit_application(payload)
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 5. DATABASE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestDatabase:
    """Tests for database relationships and integrity."""

    def test_all_sections_created(self):
        """Verify all child records are created correctly."""
        payload = get_valid_applicant_payload()
        submit_resp = submit_application(payload)
        assert submit_resp.status_code == 201
        data = submit_resp.json()["data"]

        # Verify all sections populated
        assert data["professional_details"] is not None
        assert len(data["employment_history"]) == 2
        assert len(data["education"]) == 2
        assert len(data["personality_assessment"]) == 3
        assert len(data["situational_responses"]) == 3
        assert len(data["written_responses"]) == 2
        assert data["declaration"] is not None

    def test_application_number_auto_generated(self):
        """Verify application number is auto-generated in correct format."""
        resp = submit_application(get_valid_applicant_payload())
        app_number = resp.json()["data"]["application_number"]
        assert app_number.startswith("ATLAS-APP-")
        parts = app_number.split("-")
        assert len(parts) == 4
        assert len(parts[2]) == 8  # YYYYMMDD
        assert len(parts[3]) == 4  # sequence

    def test_record_starts_as_submitted(self):
        """A newly created record starts in the SUBMITTED status (no DRAFT)."""
        submit_resp = submit_application(get_valid_applicant_payload())
        applicant_id = submit_resp.json()["data"]["candidate_id"]
        assert submit_resp.json()["data"]["status"] == SUBMITTED_STATUS

        # GET now requires staff authentication; it reflects the same status.
        headers = get_auth_headers()
        get_resp = client.get(f"/api/applicants/{applicant_id}", headers=headers)
        assert get_resp.json()["data"]["status"] == SUBMITTED_STATUS

    def test_timestamps_populated(self):
        """Verify created_at and updated_at are populated."""
        resp = submit_application(get_valid_applicant_payload())
        data = resp.json()["data"]
        assert data["created_at"] is not None
        assert data["updated_at"] is not None


# ═══════════════════════════════════════════════════════════════════════════════
# 6. FILE UPLOAD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFileUpload:
    """Tests for the signature PDF that accompanies the atomic submit."""

    def test_signature_stored_on_disk(self):
        """Verify the submitted PDF is actually saved to disk.

        The API response never exposes file_path (server-side absolute path must
        not leak to clients), so the on-disk path is looked up from the
        ApplicantDocument DB row instead.
        """
        submit_resp = submit_application(get_valid_applicant_payload())
        assert submit_resp.status_code == 201
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        # file_path is deliberately absent from the API response documents.
        for doc in submit_resp.json()["data"]["documents"]:
            assert "file_path" not in doc

        db = SessionLocal()
        try:
            doc = (
                db.query(ApplicantDocument)
                .filter(ApplicantDocument.candidate_id == uuid.UUID(applicant_id))
                .filter(ApplicantDocument.document_type == "SIGNATURE_PDF")
                .first()
            )
            assert doc is not None
            assert os.path.exists(doc.file_path), f"File not found at {doc.file_path}"
        finally:
            db.close()

    def test_document_metadata_saved(self):
        """Verify the signature document metadata is saved and readable by staff."""
        submit_resp = submit_application(get_valid_applicant_payload(), filename="metadata_test.pdf")
        applicant_id = submit_resp.json()["data"]["candidate_id"]

        headers = get_auth_headers()
        get_resp = client.get(f"/api/applicants/{applicant_id}", headers=headers)
        data = get_resp.json()["data"]
        assert len(data["documents"]) == 1
        doc = data["documents"][0]
        assert doc["document_type"] == "SIGNATURE_PDF"
        # file_name is sanitized server-side; this name contains only safe chars.
        assert doc["file_name"] == "metadata_test.pdf"


# ═══════════════════════════════════════════════════════════════════════════════
# Run all tests
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
