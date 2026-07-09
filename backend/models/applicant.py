"""
Applicant & Candidate Module — SQLAlchemy Models

Tables:
  - candidates (Section 1: Personal Details + Status, formerly applicants)
  - applicant_professional_details (Section 2)
  - applicant_employment_history (Section 3)
  - applicant_education (Section 4)
  - applicant_personality_assessment (Section 5)
  - applicant_situational_responses (Section 6)
  - applicant_written_responses (Section 7)
  - applicant_declaration (Section 8)
  - candidate_documents (Signature / Documents Upload, formerly applicant_documents)
  - interview_panel_assessment (Section 9 — Internal Only)
  - candidate_activity_logs (Audit Trails)
  - interview_rounds (Dynamic Multi-round Interview Engine)
  - final_decisions (Final HR/CEO Selection Details)
  - candidate_assignments (Candidate assignments to Panel/Interviewer)
"""

import uuid
from sqlalchemy import (
    Column, String, Text, Float, Numeric, Integer, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
from database.connection import Base


# ---------------------------------------------------------------------------
# Section 1 — Personal Details + Application Status (candidates table)
# ---------------------------------------------------------------------------

class Applicant(Base):
    __tablename__ = "candidates"

    candidate_id = Column(
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
        String(50), nullable=False, default="DRAFT", index=True
    )  # DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED, HIRED, RECEPTION_FORWARDED, etc.
    domain = Column(String(100), nullable=True)
    total_rounds = Column(Integer, nullable=True)
    
    # Form header details
    position_applied_for = Column(String(100), nullable=True)
    referred_by = Column(String(100), nullable=True)
    reference_number = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Backward compatibility with applicant_id
    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value

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
    interview_panel_assessments = relationship(
        "InterviewPanelAssessment",
        back_populates="applicant",
        cascade="all, delete-orphan",
    )
    activity_logs = relationship(
        "CandidateActivityLog",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    interview_rounds = relationship(
        "InterviewRound",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    final_decision = relationship(
        "FinalDecision",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan"
    )
    assignments = relationship(
        "CandidateAssignment",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Section 2 — Professional Details
# ---------------------------------------------------------------------------

class ApplicantProfessionalDetail(Base):
    __tablename__ = "applicant_professional_details"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    current_company = Column(String(100), nullable=True)
    current_designation = Column(String(100), nullable=True)
    total_experience = Column(Numeric(4, 1), nullable=False, default=0)
    relevant_experience = Column(Numeric(4, 1), nullable=False, default=0)
    current_ctc = Column(Numeric(12, 2), nullable=True)
    expected_ctc = Column(Numeric(12, 2), nullable=True)
    notice_period = Column(String(50), nullable=True)
    joining_availability = Column(String(50), nullable=True)
    preferred_location = Column(String(100), nullable=True)
    employment_type = Column(
        String(20), nullable=False, default="FULL_TIME"
    )  # FULL_TIME, PART_TIME, CONTRACT, INTERN

    applicant = relationship("Applicant", back_populates="professional_details")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 3 — Employment History (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantEmploymentHistory(Base):
    __tablename__ = "applicant_employment_history"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    company_name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    responsibilities = Column(Text, nullable=True)
    reason_for_leaving = Column(Text, nullable=True)

    applicant = relationship("Applicant", back_populates="employment_history")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 4 — Educational Qualifications (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantEducation(Base):
    __tablename__ = "applicant_education"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    qualification = Column(String(100), nullable=False)
    institution_name = Column(String(150), nullable=False)
    university = Column(String(150), nullable=True)
    passing_year = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=True)
    grade = Column(String(10), nullable=True)
    specialization = Column(String(100), nullable=True)

    applicant = relationship("Applicant", back_populates="education")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 5 — Personality Assessment / Your Perspective (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantPersonalityAssessment(Base):
    __tablename__ = "applicant_personality_assessment"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_number = Column(Integer, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5

    __table_args__ = (
        UniqueConstraint(
            "candidate_id", "question_number",
            name="uq_personality_candidate_question",
        ),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_rating_range"),
    )

    applicant = relationship("Applicant", back_populates="personality_assessment")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 6 — Situational / Workplace Scenarios (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantSituationalResponse(Base):
    __tablename__ = "applicant_situational_responses"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_number = Column(Integer, nullable=False)
    selected_option = Column(String(1), nullable=False)  # A, B, C, D

    __table_args__ = (
        UniqueConstraint(
            "candidate_id", "question_number",
            name="uq_situational_candidate_question",
        ),
        CheckConstraint(
            "selected_option IN ('A','B','C','D')",
            name="ck_option_abcd",
        ),
    )

    applicant = relationship("Applicant", back_populates="situational_responses")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 7 — Written / Descriptive Responses (one-to-many)
# ---------------------------------------------------------------------------

class ApplicantWrittenResponse(Base):
    __tablename__ = "applicant_written_responses"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_number = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "candidate_id", "question_number",
            name="uq_written_candidate_question",
        ),
    )

    applicant = relationship("Applicant", back_populates="written_responses")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 8 — Declaration & Consent
# ---------------------------------------------------------------------------

class ApplicantDeclaration(Base):
    __tablename__ = "applicant_declaration"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    declaration_accepted = Column(Boolean, nullable=False, default=False)
    consent_accepted = Column(Boolean, nullable=False, default=False)
    signed_date = Column(Date, nullable=True)

    applicant = relationship("Applicant", back_populates="declaration")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Document / Signature Upload (candidate_documents table)
# ---------------------------------------------------------------------------

class ApplicantDocument(Base):
    __tablename__ = "candidate_documents"

    document_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    document_type = Column(
        String(30), nullable=False, default="SIGNATURE_PDF"
    )
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="documents")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# Section 9 — Interview Panel Assessment (INTERNAL USE ONLY)
# ---------------------------------------------------------------------------

class InterviewPanelAssessment(Base):
    __tablename__ = "interview_panel_assessment"

    id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    panel_member_name = Column(String(100), nullable=True)
    panel_role = Column(String(50), nullable=True)
    technical_rating = Column(Integer, nullable=True)
    communication_rating = Column(Integer, nullable=True)
    overall_rating = Column(Integer, nullable=True)
    recommendation = Column(String(20), nullable=True)  # HIRE, REJECT, HOLD
    comments = Column(Text, nullable=True)
    assessed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "technical_rating IS NULL OR (technical_rating BETWEEN 1 AND 5)",
            name="ck_panel_technical_rating",
        ),
        CheckConstraint(
            "communication_rating IS NULL OR "
            "(communication_rating BETWEEN 1 AND 5)",
            name="ck_panel_communication_rating",
        ),
        CheckConstraint(
            "overall_rating IS NULL OR (overall_rating BETWEEN 1 AND 5)",
            name="ck_panel_overall_rating",
        ),
    )

    applicant = relationship("Applicant", back_populates="interview_panel_assessments")

    @hybrid_property
    def applicant_id(self):
        return self.candidate_id

    @applicant_id.setter
    def applicant_id(self, value):
        self.candidate_id = value


# ---------------------------------------------------------------------------
# NEW TABLES FOR WORKFLOW AND ENGINE
# ---------------------------------------------------------------------------

class CandidateActivityLog(Base):
    __tablename__ = "candidate_activity_logs"

    log_id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    candidate_id = Column(pgUUID(as_uuid=True), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    performed_by = Column(String(100), nullable=False)  # User email or role
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Applicant", back_populates="activity_logs")


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    round_id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    candidate_id = Column(pgUUID(as_uuid=True), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    round_type = Column(String(50), nullable=False)  # HR_REVIEW, TECHNICAL, CEO_ROUND
    assigned_interviewer = Column(String(100), nullable=False)  # Interviewer email
    next_interviewer_email = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, COMPLETED, REJECTED, HOLD
    remarks = Column(Text, nullable=True)
    evaluation_data = Column(JSONB, nullable=True)  # structured evaluation payload
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    candidate = relationship("Applicant", back_populates="interview_rounds")


class FinalDecision(Base):
    __tablename__ = "final_decisions"

    decision_id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    candidate_id = Column(pgUUID(as_uuid=True), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, unique=True)
    final_status = Column(String(20), nullable=False)  # SELECTED, REJECTED, HOLD
    offered_ctc = Column(Numeric(12, 2), nullable=True)
    joining_date = Column(Date, nullable=True)
    approved_by = Column(String(100), nullable=False)  # CEO or Admin email
    final_remarks = Column(Text, nullable=True)
    hr_discussion_notes = Column(Text, nullable=True)
    decision_date = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Applicant", back_populates="final_decision")


class CandidateAssignment(Base):
    __tablename__ = "candidate_assignments"

    assignment_id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    candidate_id = Column(pgUUID(as_uuid=True), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to = Column(String(100), nullable=False)  # Interviewer email or role name
    assigned_by = Column(String(100), nullable=False)  # HR Admin email
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, COMPLETED, OVERRIDDEN

    candidate = relationship("Applicant", back_populates="assignments")
