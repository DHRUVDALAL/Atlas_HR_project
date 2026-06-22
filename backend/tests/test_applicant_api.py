"""
Applicant Form Intake Module — Comprehensive Test Suite

Test Categories:
  1. API Tests (CRUD + Submit + Signature Upload)
  2. Validation Tests (all field-level validators)
  3. Negative Tests (error cases)
  4. Database Tests (relationships, cascades)
  5. File Upload Tests (PDF validation, size limits)

Usage:
  cd /Users/dhruv/Desktop/SAP_Project/Atlas/backend
  python3 -m pytest tests/test_applicant_api.py -v
"""

import os
import io
import sys
import uuid
import pytest
from datetime import date, timedelta

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.connection import Base, get_db
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
# Test Data Fixtures
# ---------------------------------------------------------------------------

def get_valid_applicant_payload():
    """Return a complete valid applicant payload for testing."""
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
    """Return a minimal payload with only required Section 1 fields."""
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
# 1. API TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateApplicant:
    """Tests for POST /api/applicants"""

    def test_create_full_application(self):
        """Should create a full draft application with all sections."""
        payload = get_valid_applicant_payload()
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "DRAFT"
        assert data["data"]["application_number"].startswith("ATLAS-APP-")
        assert data["data"]["first_name"] == "John"
        assert data["data"]["professional_details"] is not None
        assert len(data["data"]["employment_history"]) == 2
        assert len(data["data"]["education"]) == 2
        assert len(data["data"]["personality_assessment"]) == 3
        assert len(data["data"]["situational_responses"]) == 3
        assert len(data["data"]["written_responses"]) == 2
        assert data["data"]["declaration"] is not None

    def test_create_minimal_application(self):
        """Should create a draft with only Section 1."""
        payload = get_minimal_applicant_payload()
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "DRAFT"
        assert data["data"]["professional_details"] is None
        assert len(data["data"]["employment_history"]) == 0

    def test_create_duplicate_email_fails(self):
        """Should reject duplicate email."""
        payload = get_valid_applicant_payload()
        response1 = client.post("/api/applicants", json=payload)
        assert response1.status_code == 201

        # Same email again
        response2 = client.post("/api/applicants", json=payload)
        assert response2.status_code == 400


class TestGetApplicant:
    """Tests for GET /api/applicants/{id}"""

    def test_get_existing_applicant(self):
        """Should return the full applicant with all sections."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.get(f"/api/applicants/{applicant_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["applicant_id"] == applicant_id

    def test_get_nonexistent_applicant(self):
        """Should return 404 for non-existent ID."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/applicants/{fake_id}")
        assert response.status_code == 404

    def test_get_invalid_id_format(self):
        """Should return 400 for invalid UUID format."""
        response = client.get("/api/applicants/not-a-uuid")
        assert response.status_code == 400


class TestListApplicants:
    """Tests for GET /api/applicants"""

    def test_list_applicants(self):
        """Should return a paginated list."""
        response = client.get("/api/applicants")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "total" in data
        assert "applicants" in data

    def test_list_with_pagination(self):
        """Should respect skip and limit parameters."""
        response = client.get("/api/applicants?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["skip"] == 0

    def test_list_with_status_filter(self):
        """Should filter by status."""
        response = client.get("/api/applicants?status=DRAFT")
        assert response.status_code == 200
        data = response.json()
        for app in data["applicants"]:
            assert app["status"] == "DRAFT"


class TestUpdateApplicant:
    """Tests for PUT /api/applicants/{id}"""

    def test_update_personal_details(self):
        """Should update personal details of a DRAFT application."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

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
        response = client.put(f"/api/applicants/{applicant_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["first_name"] == "Jane Updated"
        assert data["data"]["city"] == "Bangalore"

    def test_add_sections_via_update(self):
        """Should add new sections to an existing draft."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

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
        response = client.put(f"/api/applicants/{applicant_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["professional_details"]["current_company"] == "New Corp"
        assert len(data["data"]["personality_assessment"]) == 1

    def test_update_nonexistent_fails(self):
        """Should return 404 for non-existent applicant."""
        fake_id = str(uuid.uuid4())
        response = client.put(f"/api/applicants/{fake_id}", json={"personal_details": None})
        assert response.status_code == 404


class TestSubmitApplicant:
    """Tests for POST /api/applicants/{id}/submit"""

    def test_submit_complete_application(self):
        """Should successfully submit a complete DRAFT application."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "SUBMITTED"

    def test_submit_incomplete_application_fails(self):
        """Should fail if required sections are missing."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 400

    def test_submit_already_submitted_fails(self):
        """Should fail if application is already submitted."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        # Submit once
        client.post(f"/api/applicants/{applicant_id}/submit")

        # Try submit again
        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 400

    def test_update_submitted_application_fails(self):
        """Should not allow updating a submitted application."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        client.post(f"/api/applicants/{applicant_id}/submit")

        update_payload = {
            "professional_details": {
                "current_company": "Should Not Update",
                "current_designation": "N/A",
                "total_experience": 1.0,
                "relevant_experience": 1.0,
                "employment_type": "FULL_TIME"
            }
        }
        response = client.put(f"/api/applicants/{applicant_id}", json=update_payload)
        assert response.status_code == 400


class TestSignatureUpload:
    """Tests for POST /api/applicants/{id}/signature"""

    def test_upload_valid_pdf(self):
        """Should accept a valid PDF file."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        # Create a minimal valid PDF
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
        file = io.BytesIO(pdf_content)

        response = client.post(
            f"/api/applicants/{applicant_id}/signature",
            files={"file": ("signature.pdf", file, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["document_type"] == "SIGNATURE_PDF"

    def test_upload_non_pdf_rejected(self):
        """Should reject non-PDF files."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        file = io.BytesIO(b"This is a text file, not a PDF")
        response = client.post(
            f"/api/applicants/{applicant_id}/signature",
            files={"file": ("signature.txt", file, "text/plain")},
        )
        assert response.status_code == 400

    def test_upload_oversized_file_rejected(self):
        """Should reject files larger than 5 MB."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        # Create a 6 MB file
        large_content = b"%PDF-1.4\n" + (b"x" * (6 * 1024 * 1024))
        file = io.BytesIO(large_content)

        response = client.post(
            f"/api/applicants/{applicant_id}/signature",
            files={"file": ("signature.pdf", file, "application/pdf")},
        )
        assert response.status_code == 413

    def test_upload_to_nonexistent_applicant_fails(self):
        """Should return 404 for non-existent applicant."""
        fake_id = str(uuid.uuid4())
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
        file = io.BytesIO(pdf_content)

        response = client.post(
            f"/api/applicants/{fake_id}/signature",
            files={"file": ("signature.pdf", file, "application/pdf")},
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 2. VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidation:
    """Tests for all field-level validators."""

    def test_invalid_email(self):
        """Should reject invalid email format."""
        payload = get_minimal_applicant_payload()
        payload["personal_details"]["email"] = "not-an-email"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_phone_not_10_digits(self):
        """Should reject phone numbers that are not 10 digits."""
        payload = get_minimal_applicant_payload()
        payload["personal_details"]["phone"] = "12345"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_future_date_of_birth(self):
        """Should reject future date of birth."""
        payload = get_minimal_applicant_payload()
        future_date = (date.today() + timedelta(days=365)).isoformat()
        payload["personal_details"]["date_of_birth"] = future_date
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_invalid_gender(self):
        """Should reject invalid gender values."""
        payload = get_minimal_applicant_payload()
        payload["personal_details"]["gender"] = "INVALID"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_negative_ctc(self):
        """Should reject negative CTC values."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["current_ctc"] = -50000
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_negative_experience(self):
        """Should reject negative experience values."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["total_experience"] = -1
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_invalid_passing_year_too_old(self):
        """Should reject passing year before 1900."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["passing_year"] = 1800
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_invalid_passing_year_future(self):
        """Should reject passing year in the future."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["passing_year"] = date.today().year + 5
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_rating_below_1(self):
        """Should reject ratings below 1."""
        payload = get_valid_applicant_payload()
        payload["personality_assessment"][0]["rating"] = 0
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_rating_above_5(self):
        """Should reject ratings above 5."""
        payload = get_valid_applicant_payload()
        payload["personality_assessment"][0]["rating"] = 6
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_invalid_scenario_option(self):
        """Should reject options other than A, B, C, D."""
        payload = get_valid_applicant_payload()
        payload["situational_responses"][0]["selected_option"] = "E"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_answer_too_short(self):
        """Should reject written answers shorter than 20 characters."""
        payload = get_valid_applicant_payload()
        payload["written_responses"][0]["answer_text"] = "Too short"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_answer_too_long(self):
        """Should reject written answers longer than 2000 characters."""
        payload = get_valid_applicant_payload()
        payload["written_responses"][0]["answer_text"] = "x" * 2001
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_invalid_employment_type(self):
        """Should reject invalid employment type."""
        payload = get_valid_applicant_payload()
        payload["professional_details"]["employment_type"] = "INVALID_TYPE"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_employment_end_before_start(self):
        """Should reject employment end date before start date."""
        payload = get_valid_applicant_payload()
        payload["employment_history"][0]["start_date"] = "2023-01-01"
        payload["employment_history"][0]["end_date"] = "2020-01-01"
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_percentage_above_100(self):
        """Should reject percentage above 100."""
        payload = get_valid_applicant_payload()
        payload["education"][0]["percentage"] = 105.0
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# 3. NEGATIVE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestNegativeCases:
    """Edge cases and error scenarios."""

    def test_empty_body(self):
        """Should reject empty request body."""
        response = client.post("/api/applicants", json={})
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Should reject payload missing required personal details fields."""
        payload = {
            "personal_details": {
                "first_name": "Test"
                # Missing all other required fields
            }
        }
        response = client.post("/api/applicants", json=payload)
        assert response.status_code == 422

    def test_submit_without_declaration(self):
        """Should fail submission if declaration is missing."""
        payload = get_minimal_applicant_payload()
        payload["professional_details"] = {
            "current_company": "Test",
            "current_designation": "Dev",
            "total_experience": 1.0,
            "relevant_experience": 1.0,
            "employment_type": "FULL_TIME"
        }
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 400

    def test_submit_with_false_declaration(self):
        """Should fail if declaration_accepted is False."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["declaration_accepted"] = False
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 400

    def test_submit_with_false_consent(self):
        """Should fail if consent_accepted is False."""
        payload = get_valid_applicant_payload()
        payload["declaration"]["consent_accepted"] = False
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        response = client.post(f"/api/applicants/{applicant_id}/submit")
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 4. DATABASE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestDatabase:
    """Tests for database relationships and integrity."""

    def test_all_sections_created(self):
        """Verify all child records are created correctly."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()["data"]

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
        payload = get_minimal_applicant_payload()
        resp = client.post("/api/applicants", json=payload)
        app_number = resp.json()["data"]["application_number"]
        assert app_number.startswith("ATLAS-APP-")
        parts = app_number.split("-")
        assert len(parts) == 4
        assert len(parts[2]) == 8  # YYYYMMDD
        assert len(parts[3]) == 4  # sequence

    def test_status_transitions(self):
        """Verify status changes from DRAFT to SUBMITTED."""
        payload = get_valid_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        # Verify DRAFT
        get_resp = client.get(f"/api/applicants/{applicant_id}")
        assert get_resp.json()["data"]["status"] == "DRAFT"

        # Submit
        client.post(f"/api/applicants/{applicant_id}/submit")

        # Verify SUBMITTED
        get_resp = client.get(f"/api/applicants/{applicant_id}")
        assert get_resp.json()["data"]["status"] == "SUBMITTED"

    def test_timestamps_populated(self):
        """Verify created_at and updated_at are populated."""
        payload = get_minimal_applicant_payload()
        resp = client.post("/api/applicants", json=payload)
        data = resp.json()["data"]
        assert data["created_at"] is not None
        assert data["updated_at"] is not None


# ═══════════════════════════════════════════════════════════════════════════════
# 5. FILE UPLOAD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFileUpload:
    """Tests for signature PDF file upload mechanics."""

    def test_pdf_stored_on_disk(self):
        """Verify uploaded PDF is actually saved to disk."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
        file = io.BytesIO(pdf_content)

        response = client.post(
            f"/api/applicants/{applicant_id}/signature",
            files={"file": ("test_signature.pdf", file, "application/pdf")},
        )
        assert response.status_code == 200

        file_path = response.json()["data"]["file_path"]
        assert os.path.exists(file_path), f"File not found at {file_path}"

    def test_document_metadata_saved(self):
        """Verify document metadata is saved in database."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
        file = io.BytesIO(pdf_content)

        client.post(
            f"/api/applicants/{applicant_id}/signature",
            files={"file": ("metadata_test.pdf", file, "application/pdf")},
        )

        # Fetch applicant and check documents
        get_resp = client.get(f"/api/applicants/{applicant_id}")
        data = get_resp.json()["data"]
        assert len(data["documents"]) >= 1
        doc = data["documents"][-1]
        assert doc["document_type"] == "SIGNATURE_PDF"
        assert doc["file_name"] == "metadata_test.pdf"

    def test_multiple_signatures_allowed(self):
        """Verify multiple signature uploads are recorded."""
        payload = get_minimal_applicant_payload()
        create_resp = client.post("/api/applicants", json=payload)
        applicant_id = create_resp.json()["data"]["applicant_id"]

        for i in range(3):
            pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
            file = io.BytesIO(pdf_content)
            resp = client.post(
                f"/api/applicants/{applicant_id}/signature",
                files={"file": (f"sig_{i}.pdf", file, "application/pdf")},
            )
            assert resp.status_code == 200

        get_resp = client.get(f"/api/applicants/{applicant_id}")
        assert len(get_resp.json()["data"]["documents"]) == 3


# ═══════════════════════════════════════════════════════════════════════════════
# Run all tests
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
