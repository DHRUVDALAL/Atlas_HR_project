import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path("C:/Users/dhruv/Desktop/Atlas_HR_project-main/backend").resolve()))

from schemas.applicant import ApplicantFullCreate
from pydantic import ValidationError

frontend_payload = {
    "personal_details": {
      "first_name": "Test",
      "middle_name": None,
      "last_name": "User",
      "email": "test@test.com",
      "phone": "1234567890",
      "alternate_phone": None,
      "gender": "MALE",
      "date_of_birth": "2000-01-01",
      "current_address": "Test Address 123",
      "permanent_address": "Test Address 123",
      "city": "TestCity",
      "state": "TestState",
      "country": "TestCountry",
      "pincode": "123456",
      "position_applied_for": None,
      "applied_from": None,
      "source_name": None,
      "reference_number": None
    },
    "professional_details": {
      "current_company": None,
      "current_designation": None,
      "total_experience": 0,
      "relevant_experience": 0,
      "current_ctc": None,
      "expected_ctc": None,
      "notice_period": None,
      "joining_availability": None,
      "preferred_location": None,
      "employment_type": "FULL_TIME"
    },
    "employment_history": [],
    "education": [
      {
        "qualification": "BTech",
        "institution_name": "Test Inst",
        "university": None,
        "passing_year": 2020,
        "percentage": 85.0,
        "grade": None,
        "specialization": None
      }
    ],
    "personality_assessment": [],
    "situational_responses": [],
    "written_responses": [],
    "declaration": {
      "declaration_accepted": True,
      "consent_accepted": True,
      "signed_date": "2026-07-27"
    }
}

try:
    ApplicantFullCreate.model_validate_json(json.dumps(frontend_payload))
    print("Valid!")
except ValidationError as e:
    print("Validation Error:")
    print(e.json())
