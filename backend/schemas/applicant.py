"""
Applicant Form Intake Module — Pydantic Schemas

Provides request/response schemas with full validation for all 8 applicant-facing
sections plus composite schemas for create/update/response operations.
"""

from pydantic import (
    BaseModel, EmailStr, Field, field_validator, model_validator,
)
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
import re


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS (as string literals with validators)
# ═══════════════════════════════════════════════════════════════════════════════

VALID_GENDERS = {"MALE", "FEMALE", "OTHER"}
VALID_EMPLOYMENT_TYPES = {"FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"}
VALID_OPTIONS = {"A", "B", "C", "D"}
VALID_STATUSES = {
    "DRAFT", "SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "HIRED"
}


# ═══════════════════════════════════════════════════════════════════════════════
# Section 1 — Personal Details
# ═══════════════════════════════════════════════════════════════════════════════

class ApplicantCreate(BaseModel):
    """Create/Update schema for Section 1 — Personal Details."""

    first_name: str = Field(..., min_length=1, max_length=50)
    middle_name: Optional[str] = Field(None, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    alternate_phone: Optional[str] = Field(None, max_length=15)
    gender: str = Field(..., max_length=10)
    date_of_birth: date

    current_address: str = Field(..., min_length=5)
    permanent_address: Optional[str] = None
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    country: str = Field(..., min_length=1, max_length=50)
    pincode: str = Field(..., min_length=4, max_length=10)

    @field_validator("phone", "alternate_phone")
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        digits = re.sub(r"[^\d]", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        upper = v.upper()
        if upper not in VALID_GENDERS:
            raise ValueError(f"Gender must be one of {VALID_GENDERS}")
        return upper

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v):
        if v > date.today():
            raise ValueError("Date of birth cannot be a future date")
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Section 2 — Professional Details
# ═══════════════════════════════════════════════════════════════════════════════

class ProfessionalDetailSchema(BaseModel):
    """Schema for Section 2 — Professional Details."""

    current_company: Optional[str] = Field(None, max_length=100)
    current_designation: Optional[str] = Field(None, max_length=100)
    total_experience: float = Field(..., ge=0)
    relevant_experience: float = Field(..., ge=0)
    current_ctc: Optional[float] = Field(None, ge=0)
    expected_ctc: Optional[float] = Field(None, ge=0)
    notice_period: Optional[str] = Field(None, max_length=50)
    joining_availability: Optional[str] = Field(None, max_length=50)
    preferred_location: Optional[str] = Field(None, max_length=100)
    employment_type: str = Field("FULL_TIME", max_length=20)

    @field_validator("employment_type")
    @classmethod
    def validate_employment_type(cls, v):
        upper = v.upper()
        if upper not in VALID_EMPLOYMENT_TYPES:
            raise ValueError(
                f"Employment type must be one of {VALID_EMPLOYMENT_TYPES}"
            )
        return upper


# ═══════════════════════════════════════════════════════════════════════════════
# Section 3 — Employment History (list)
# ═══════════════════════════════════════════════════════════════════════════════

class EmploymentHistorySchema(BaseModel):
    """Schema for a single employment history record."""

    company_name: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    responsibilities: Optional[str] = None
    reason_for_leaving: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


# ═══════════════════════════════════════════════════════════════════════════════
# Section 4 — Educational Qualifications (list)
# ═══════════════════════════════════════════════════════════════════════════════

class EducationSchema(BaseModel):
    """Schema for a single education record."""

    qualification: str = Field(..., min_length=1, max_length=100)
    institution_name: str = Field(..., min_length=1, max_length=150)
    university: Optional[str] = Field(None, max_length=150)
    passing_year: int
    percentage: Optional[float] = Field(None, ge=0, le=100)
    grade: Optional[str] = Field(None, max_length=10)
    specialization: Optional[str] = Field(None, max_length=100)

    @field_validator("passing_year")
    @classmethod
    def validate_passing_year(cls, v):
        current_year = date.today().year
        if v < 1900 or v > current_year:
            raise ValueError(
                f"Passing year must be between 1900 and {current_year}"
            )
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Section 5 — Personality Assessment / Your Perspective (list)
# ═══════════════════════════════════════════════════════════════════════════════

class PersonalityRatingSchema(BaseModel):
    """Schema for a single personality assessment rating."""

    question_number: int = Field(..., ge=1)
    rating: int = Field(..., ge=1, le=5)


# ═══════════════════════════════════════════════════════════════════════════════
# Section 6 — Situational / Workplace Scenarios (list)
# ═══════════════════════════════════════════════════════════════════════════════

class SituationalResponseSchema(BaseModel):
    """Schema for a single situational response."""

    question_number: int = Field(..., ge=1)
    selected_option: str = Field(..., max_length=1)

    @field_validator("selected_option")
    @classmethod
    def validate_option(cls, v):
        upper = v.upper()
        if upper not in VALID_OPTIONS:
            raise ValueError("Selected option must be one of A, B, C, D")
        return upper


# ═══════════════════════════════════════════════════════════════════════════════
# Section 7 — Written / Descriptive Responses (list)
# ═══════════════════════════════════════════════════════════════════════════════

class WrittenResponseSchema(BaseModel):
    """Schema for a single written response."""

    question_number: int = Field(..., ge=1)
    answer_text: str = Field(..., min_length=20, max_length=2000)


# ═══════════════════════════════════════════════════════════════════════════════
# Section 8 — Declaration & Consent
# ═══════════════════════════════════════════════════════════════════════════════

class DeclarationSchema(BaseModel):
    """Schema for Section 8 — Declaration & Consent."""

    declaration_accepted: bool
    consent_accepted: bool
    signed_date: Optional[date] = None


# ═══════════════════════════════════════════════════════════════════════════════
# COMPOSITE SCHEMAS — Full Application Create / Update
# ═══════════════════════════════════════════════════════════════════════════════

class ApplicantFullCreate(BaseModel):
    """
    Composite schema for creating or updating a full application.
    All sections are optional so applicants can save partial drafts.
    """

    # Section 1 — Personal Details (required for initial create)
    personal_details: ApplicantCreate

    # Section 2 — Professional Details
    professional_details: Optional[ProfessionalDetailSchema] = None

    # Section 3 — Employment History
    employment_history: Optional[List[EmploymentHistorySchema]] = None

    # Section 4 — Education
    education: Optional[List[EducationSchema]] = None

    # Section 5 — Personality Assessment
    personality_assessment: Optional[List[PersonalityRatingSchema]] = None

    # Section 6 — Situational Responses
    situational_responses: Optional[List[SituationalResponseSchema]] = None

    # Section 7 — Written Responses
    written_responses: Optional[List[WrittenResponseSchema]] = None

    # Section 8 — Declaration
    declaration: Optional[DeclarationSchema] = None


class ApplicantUpdate(BaseModel):
    """
    Schema for updating an existing draft application.
    All sections are optional — only provided sections are updated.
    """

    personal_details: Optional[ApplicantCreate] = None
    professional_details: Optional[ProfessionalDetailSchema] = None
    employment_history: Optional[List[EmploymentHistorySchema]] = None
    education: Optional[List[EducationSchema]] = None
    personality_assessment: Optional[List[PersonalityRatingSchema]] = None
    situational_responses: Optional[List[SituationalResponseSchema]] = None
    written_responses: Optional[List[WrittenResponseSchema]] = None
    declaration: Optional[DeclarationSchema] = None


# ═══════════════════════════════════════════════════════════════════════════════
# RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ProfessionalDetailResponse(BaseModel):
    current_company: Optional[str] = None
    current_designation: Optional[str] = None
    total_experience: float
    relevant_experience: float
    current_ctc: Optional[float] = None
    expected_ctc: Optional[float] = None
    notice_period: Optional[str] = None
    joining_availability: Optional[str] = None
    preferred_location: Optional[str] = None
    employment_type: str

    model_config = {"from_attributes": True}


class EmploymentHistoryResponse(BaseModel):
    company_name: str
    designation: str
    start_date: date
    end_date: Optional[date] = None
    responsibilities: Optional[str] = None
    reason_for_leaving: Optional[str] = None

    model_config = {"from_attributes": True}


class EducationResponse(BaseModel):
    qualification: str
    institution_name: str
    university: Optional[str] = None
    passing_year: int
    percentage: Optional[float] = None
    grade: Optional[str] = None
    specialization: Optional[str] = None

    model_config = {"from_attributes": True}


class PersonalityRatingResponse(BaseModel):
    question_number: int
    rating: int

    model_config = {"from_attributes": True}


class SituationalResponseResponse(BaseModel):
    question_number: int
    selected_option: str

    model_config = {"from_attributes": True}


class WrittenResponseResponse(BaseModel):
    question_number: int
    answer_text: str

    model_config = {"from_attributes": True}


class DeclarationResponse(BaseModel):
    declaration_accepted: bool
    consent_accepted: bool
    signed_date: Optional[date] = None

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    document_id: str
    document_type: str
    file_name: str
    file_path: str
    uploaded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("document_id", mode="before")
    @classmethod
    def stringify_uuid(cls, v):
        return str(v) if v else v


class ApplicantResponse(BaseModel):
    """Full applicant response with all nested sections."""

    applicant_id: str
    application_number: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    phone: str
    alternate_phone: Optional[str] = None
    gender: str
    date_of_birth: date
    current_address: str
    permanent_address: Optional[str] = None
    city: str
    state: str
    country: str
    pincode: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Nested sections
    professional_details: Optional[ProfessionalDetailResponse] = None
    employment_history: List[EmploymentHistoryResponse] = []
    education: List[EducationResponse] = []
    personality_assessment: List[PersonalityRatingResponse] = []
    situational_responses: List[SituationalResponseResponse] = []
    written_responses: List[WrittenResponseResponse] = []
    declaration: Optional[DeclarationResponse] = None
    documents: List[DocumentResponse] = []

    model_config = {"from_attributes": True}

    @field_validator("applicant_id", mode="before")
    @classmethod
    def stringify_uuid(cls, v):
        return str(v) if v else v


class ApplicantListItem(BaseModel):
    """Summary schema for list endpoint."""

    applicant_id: str
    application_number: str
    first_name: str
    last_name: str
    email: str
    phone: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("applicant_id", mode="before")
    @classmethod
    def stringify_uuid(cls, v):
        return str(v) if v else v


class ApplicantListResponse(BaseModel):
    """Paginated list response."""

    success: bool
    total: int
    skip: int
    limit: int
    applicants: List[ApplicantListItem]
