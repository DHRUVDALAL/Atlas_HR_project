"""
Applicant Form Intake Module — SQLAlchemy Models

Tables:
  - applicants (Section 1: Personal Details + Status)
  - applicant_professional_details (Section 2)
  - applicant_employment_history (Section 3)
  - applicant_education (Section 4)
  - applicant_personality_assessment (Section 5)
  - applicant_situational_responses (Section 6)
  - applicant_written_responses (Section 7)
  - applicant_declaration (Section 8)
  - applicant_documents (Signature Upload)
  - interview_panel_assessment (Section 9 — Internal Only)
"""

import uuid
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


# ---------------------------------------------------------------------------
# Section 1 — Personal Details + Application Status
# ---------------------------------------------------------------------------

class Applicant(Base):
    __tablename__ = "applicants"

    applicant_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    application_number = Column(
        String(30), unique=True, index=True, nullable=False
    )

    # Personal information
    first_name = Column(String(50), nullable=False)
    middle_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(15), nullable=False)
    alternate_phone = Column(String(15), nullable=True)
    gender = Column(String(10), nullable=False)  # MALE, FEMALE, OTHER
    date_of_birth = Column(Date, nullable=False)

    # Address
    current_address = Column(Text, nullable=False)
    permanent_address = Column(Text, nullable=True)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)
    pincode = Column(String(10), nullable=False)

    # Status & timestamps
    status = Column(
        String(20), nullable=False, default="DRAFT", index=True
    )  # DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED, HIRED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    professional_details = relationship(
        "ApplicantProfessionalDetail",
        back_populates="applicant",
        uselist=False,
        cascade="all, delete-orphan",
    )
    employment_history = relationship(
        "ApplicantEmploymentHistory",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    education = relationship(
        "ApplicantEducation",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    personality_assessment = relationship(
        "ApplicantPersonalityAssessment",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    situational_responses = relationship(
        "ApplicantSituationalResponse",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    written_responses = relationship(
        "ApplicantWrittenResponse",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    declaration = relationship(
        "ApplicantDeclaration",
        back_populates="applicant",
        uselist=False,
        cascade="all, delete-orphan",
    )
    documents = relationship(
        "ApplicantDocument",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# Section 2 — Professional Details
# ---------------------------------------------------------------------------

class ApplicantProfessionalDetail(Base):
    __tablename__ = "applicant_professional_details"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    current_company = Column(String(100), nullable=True)
    current_designation = Column(String(100), nullable=True)
    total_experience = Column(Float, nullable=False, default=0)
    relevant_experience = Column(Float, nullable=False, default=0)
    current_ctc = Column(Float, nullable=True)
    expected_ctc = Column(Float, nullable=True)
    notice_period = Column(String(50), nullable=True)
    joining_availability = Column(String(50), nullable=True)
    preferred_location = Column(String(100), nullable=True)
    employment_type = Column(
        String(20), nullable=False, default="FULL_TIME"
    )  # FULL_TIME, PART_TIME, CONTRACT, INTERN

    applicant = relationship("Applicant", back_populates="professional_details")


# ---------------------------------------------------------------------------
# Section 3 — Employment History (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantEmploymentHistory(Base):
    __tablename__ = "applicant_employment_history"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    company_name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    responsibilities = Column(Text, nullable=True)
    reason_for_leaving = Column(Text, nullable=True)

    applicant = relationship("Applicant", back_populates="employment_history")


# ---------------------------------------------------------------------------
# Section 4 — Educational Qualifications (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantEducation(Base):
    __tablename__ = "applicant_education"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    qualification = Column(String(100), nullable=False)
    institution_name = Column(String(150), nullable=False)
    university = Column(String(150), nullable=True)
    passing_year = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=True)
    grade = Column(String(10), nullable=True)
    specialization = Column(String(100), nullable=True)

    applicant = relationship("Applicant", back_populates="education")


# ---------------------------------------------------------------------------
# Section 5 — Personality Assessment / Your Perspective (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantPersonalityAssessment(Base):
    __tablename__ = "applicant_personality_assessment"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    question_number = Column(Integer, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5

    __table_args__ = (
        UniqueConstraint(
            "applicant_id", "question_number",
            name="uq_personality_applicant_question",
        ),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_rating_range"),
    )

    applicant = relationship("Applicant", back_populates="personality_assessment")


# ---------------------------------------------------------------------------
# Section 6 — Situational / Workplace Scenarios (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantSituationalResponse(Base):
    __tablename__ = "applicant_situational_responses"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    question_number = Column(Integer, nullable=False)
    selected_option = Column(String(1), nullable=False)  # A, B, C, D

    __table_args__ = (
        UniqueConstraint(
            "applicant_id", "question_number",
            name="uq_situational_applicant_question",
        ),
        CheckConstraint(
            "selected_option IN ('A','B','C','D')",
            name="ck_option_abcd",
        ),
    )

    applicant = relationship("Applicant", back_populates="situational_responses")


# ---------------------------------------------------------------------------
# Section 7 — Written / Descriptive Responses (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantWrittenResponse(Base):
    __tablename__ = "applicant_written_responses"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    question_number = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "applicant_id", "question_number",
            name="uq_written_applicant_question",
        ),
    )

    applicant = relationship("Applicant", back_populates="written_responses")


# ---------------------------------------------------------------------------
# Section 8 — Declaration & Consent
# ---------------------------------------------------------------------------

class ApplicantDeclaration(Base):
    __tablename__ = "applicant_declaration"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    declaration_accepted = Column(Boolean, nullable=False, default=False)
    consent_accepted = Column(Boolean, nullable=False, default=False)
    signed_date = Column(Date, nullable=True)

    applicant = relationship("Applicant", back_populates="declaration")


# ---------------------------------------------------------------------------
# Signature / Document Upload
# ---------------------------------------------------------------------------

class ApplicantDocument(Base):
    __tablename__ = "applicant_documents"

    document_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    document_type = Column(
        String(30), nullable=False, default="SIGNATURE_PDF"
    )
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="documents")


# ---------------------------------------------------------------------------
# Section 9 — Interview Panel Assessment (INTERNAL USE ONLY)
# ---------------------------------------------------------------------------

class InterviewPanelAssessment(Base):
    __tablename__ = "interview_panel_assessment"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("applicants.applicant_id", ondelete="CASCADE"),
        nullable=False,
    )

    panel_member_name = Column(String(100), nullable=True)
    panel_role = Column(String(50), nullable=True)
    technical_rating = Column(Integer, nullable=True)
    communication_rating = Column(Integer, nullable=True)
    overall_rating = Column(Integer, nullable=True)
    recommendation = Column(String(20), nullable=True)  # HIRE, REJECT, HOLD
    comments = Column(Text, nullable=True)
    assessed_at = Column(DateTime(timezone=True), server_default=func.now())
