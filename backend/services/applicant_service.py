"""
Applicant Form Intake Module — Service Layer

Business logic for applicant CRUD, submission workflow, and signature upload.
"""

import os
import uuid
import shutil
from datetime import date, datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, UploadFile, status

from models.applicant import (
    Applicant,
    ApplicantProfessionalDetail,
    ApplicantEmploymentHistory,
    ApplicantEducation,
    ApplicantPersonalityAssessment,
    ApplicantSituationalResponse,
    ApplicantWrittenResponse,
    ApplicantDeclaration,
    ApplicantDocument,
)
from schemas.applicant import (
    ApplicantFullCreate,
    ApplicantUpdate,
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "uploads",
    "signatures",
)
MAX_SIGNATURE_SIZE = 5 * 1024 * 1024  # 5 MB


def _ensure_upload_dir():
    """Create uploads/signatures/ directory if it doesn't exist."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Application Number Generator
# ---------------------------------------------------------------------------

def generate_application_number(db: Session) -> str:
    """
    Generate a unique application number in the format:
    ATLAS-APP-YYYYMMDD-XXXX  (sequential within the day)
    """
    today = date.today().strftime("%Y%m%d")
    prefix = f"ATLAS-APP-{today}-"

    # Find the highest sequence number for today
    last = (
        db.query(Applicant)
        .filter(Applicant.application_number.like(f"{prefix}%"))
        .order_by(Applicant.application_number.desc())
        .first()
    )

    if last:
        last_seq = int(last.application_number.split("-")[-1])
        seq = last_seq + 1
    else:
        seq = 1

    return f"{prefix}{seq:04d}"


# ---------------------------------------------------------------------------
# Eager-load helper
# ---------------------------------------------------------------------------

def _applicant_query(db: Session):
    """Return a query with all relationships eager-loaded."""
    return db.query(Applicant).options(
        joinedload(Applicant.professional_details),
        joinedload(Applicant.employment_history),
        joinedload(Applicant.education),
        joinedload(Applicant.personality_assessment),
        joinedload(Applicant.situational_responses),
        joinedload(Applicant.written_responses),
        joinedload(Applicant.declaration),
        joinedload(Applicant.documents),
    )


def _get_applicant_or_404(db: Session, applicant_id: str) -> Applicant:
    """Fetch an applicant by ID or raise 404."""
    try:
        uid = uuid.UUID(applicant_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid applicant ID format",
        )

    applicant = _applicant_query(db).filter(
        Applicant.applicant_id == uid
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with ID {applicant_id} not found",
        )
    return applicant


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def create_applicant(db: Session, data: ApplicantFullCreate) -> Applicant:
    """Create a new draft application with all provided sections."""

    # Check duplicate email
    existing = db.query(Applicant).filter(
        Applicant.email == data.personal_details.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An application with email {data.personal_details.email} already exists",
        )

    app_number = generate_application_number(db)

    # Section 1 — Applicant core record
    applicant = Applicant(
        applicant_id=uuid.uuid4(),
        application_number=app_number,
        first_name=data.personal_details.first_name,
        middle_name=data.personal_details.middle_name,
        last_name=data.personal_details.last_name,
        email=data.personal_details.email,
        phone=data.personal_details.phone,
        alternate_phone=data.personal_details.alternate_phone,
        gender=data.personal_details.gender,
        date_of_birth=data.personal_details.date_of_birth,
        current_address=data.personal_details.current_address,
        permanent_address=data.personal_details.permanent_address,
        city=data.personal_details.city,
        state=data.personal_details.state,
        country=data.personal_details.country,
        pincode=data.personal_details.pincode,
        status="DRAFT",
    )
    db.add(applicant)
    db.flush()  # get applicant_id

    # Section 2 — Professional details
    if data.professional_details:
        pd = ApplicantProfessionalDetail(
            applicant_id=applicant.applicant_id,
            **data.professional_details.model_dump(),
        )
        db.add(pd)

    # Section 3 — Employment history
    if data.employment_history:
        for eh in data.employment_history:
            db.add(ApplicantEmploymentHistory(
                applicant_id=applicant.applicant_id,
                **eh.model_dump(),
            ))

    # Section 4 — Education
    if data.education:
        for edu in data.education:
            db.add(ApplicantEducation(
                applicant_id=applicant.applicant_id,
                **edu.model_dump(),
            ))

    # Section 5 — Personality assessment
    if data.personality_assessment:
        for pa in data.personality_assessment:
            db.add(ApplicantPersonalityAssessment(
                applicant_id=applicant.applicant_id,
                **pa.model_dump(),
            ))

    # Section 6 — Situational responses
    if data.situational_responses:
        for sr in data.situational_responses:
            db.add(ApplicantSituationalResponse(
                applicant_id=applicant.applicant_id,
                **sr.model_dump(),
            ))

    # Section 7 — Written responses
    if data.written_responses:
        for wr in data.written_responses:
            db.add(ApplicantWrittenResponse(
                applicant_id=applicant.applicant_id,
                **wr.model_dump(),
            ))

    # Section 8 — Declaration
    if data.declaration:
        db.add(ApplicantDeclaration(
            applicant_id=applicant.applicant_id,
            **data.declaration.model_dump(),
        ))

    db.commit()
    db.refresh(applicant)

    # Re-fetch with all relationships loaded
    return _get_applicant_or_404(db, str(applicant.applicant_id))


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_applicant(db: Session, applicant_id: str) -> Applicant:
    """Retrieve a single applicant with all sections."""
    return _get_applicant_or_404(db, applicant_id)


def list_applicants(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
):
    """List applicants with optional status filter and pagination."""
    query = db.query(Applicant)
    if status_filter:
        query = query.filter(Applicant.status == status_filter.upper())

    total = query.count()
    applicants = (
        query.order_by(Applicant.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, applicants


# ---------------------------------------------------------------------------
# UPDATE (draft only)
# ---------------------------------------------------------------------------

def update_applicant(
    db: Session, applicant_id: str, data: ApplicantUpdate
) -> Applicant:
    """
    Update a draft application. Only DRAFT applications can be updated.
    Provided sections replace existing data entirely.
    """
    applicant = _get_applicant_or_404(db, applicant_id)

    if applicant.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DRAFT applications can be updated",
        )

    # Section 1 — Personal details
    if data.personal_details:
        pd = data.personal_details
        # Check email uniqueness if changed
        if pd.email != applicant.email:
            existing = db.query(Applicant).filter(
                Applicant.email == pd.email,
                Applicant.applicant_id != applicant.applicant_id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email {pd.email} is already in use",
                )

        applicant.first_name = pd.first_name
        applicant.middle_name = pd.middle_name
        applicant.last_name = pd.last_name
        applicant.email = pd.email
        applicant.phone = pd.phone
        applicant.alternate_phone = pd.alternate_phone
        applicant.gender = pd.gender
        applicant.date_of_birth = pd.date_of_birth
        applicant.current_address = pd.current_address
        applicant.permanent_address = pd.permanent_address
        applicant.city = pd.city
        applicant.state = pd.state
        applicant.country = pd.country
        applicant.pincode = pd.pincode

    # Section 2 — Professional details (replace)
    if data.professional_details is not None:
        if applicant.professional_details:
            db.delete(applicant.professional_details)
            db.flush()
        db.add(ApplicantProfessionalDetail(
            applicant_id=applicant.applicant_id,
            **data.professional_details.model_dump(),
        ))

    # Section 3 — Employment history (replace all)
    if data.employment_history is not None:
        for eh in applicant.employment_history:
            db.delete(eh)
        db.flush()
        for eh in data.employment_history:
            db.add(ApplicantEmploymentHistory(
                applicant_id=applicant.applicant_id,
                **eh.model_dump(),
            ))

    # Section 4 — Education (replace all)
    if data.education is not None:
        for edu in applicant.education:
            db.delete(edu)
        db.flush()
        for edu in data.education:
            db.add(ApplicantEducation(
                applicant_id=applicant.applicant_id,
                **edu.model_dump(),
            ))

    # Section 5 — Personality assessment (replace all)
    if data.personality_assessment is not None:
        for pa in applicant.personality_assessment:
            db.delete(pa)
        db.flush()
        for pa in data.personality_assessment:
            db.add(ApplicantPersonalityAssessment(
                applicant_id=applicant.applicant_id,
                **pa.model_dump(),
            ))

    # Section 6 — Situational responses (replace all)
    if data.situational_responses is not None:
        for sr in applicant.situational_responses:
            db.delete(sr)
        db.flush()
        for sr in data.situational_responses:
            db.add(ApplicantSituationalResponse(
                applicant_id=applicant.applicant_id,
                **sr.model_dump(),
            ))

    # Section 7 — Written responses (replace all)
    if data.written_responses is not None:
        for wr in applicant.written_responses:
            db.delete(wr)
        db.flush()
        for wr in data.written_responses:
            db.add(ApplicantWrittenResponse(
                applicant_id=applicant.applicant_id,
                **wr.model_dump(),
            ))

    # Section 8 — Declaration (replace)
    if data.declaration is not None:
        if applicant.declaration:
            db.delete(applicant.declaration)
            db.flush()
        db.add(ApplicantDeclaration(
            applicant_id=applicant.applicant_id,
            **data.declaration.model_dump(),
        ))

    db.commit()
    return _get_applicant_or_404(db, applicant_id)


# ---------------------------------------------------------------------------
# SUBMIT
# ---------------------------------------------------------------------------

def submit_applicant(db: Session, applicant_id: str) -> Applicant:
    """
    Submit a DRAFT application.
    Validates that all required sections are present and declaration is accepted.
    """
    applicant = _get_applicant_or_404(db, applicant_id)

    if applicant.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is already {applicant.status}. Only DRAFT applications can be submitted.",
        )

    # Validate required sections exist
    errors = []

    if not applicant.professional_details:
        errors.append("Section 2 (Professional Details) is required")

    if not applicant.declaration:
        errors.append("Section 8 (Declaration) is required")
    elif not applicant.declaration.declaration_accepted:
        errors.append("Declaration must be accepted")
    elif not applicant.declaration.consent_accepted:
        errors.append("Consent must be accepted")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Application cannot be submitted. Missing required sections.",
                "errors": errors,
            },
        )

    applicant.status = "SUBMITTED"
    db.commit()
    db.refresh(applicant)
    return _get_applicant_or_404(db, applicant_id)


# ---------------------------------------------------------------------------
# SIGNATURE UPLOAD
# ---------------------------------------------------------------------------

def save_signature(
    db: Session, applicant_id: str, file: UploadFile
) -> ApplicantDocument:
    """
    Validate, save, and record a signature PDF upload.

    Validations:
      - Application must exist
      - File must be a PDF
      - File must be ≤ 5 MB
    """
    applicant = _get_applicant_or_404(db, applicant_id)

    # Validate content type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted for signature upload",
        )

    # Validate file name extension
    if file.filename and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a .pdf extension",
        )

    # Read file content and validate size
    content = file.file.read()
    if len(content) > MAX_SIGNATURE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of 5 MB",
        )

    # Save to disk
    _ensure_upload_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{applicant.applicant_id}_{timestamp}.pdf"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Save metadata to database
    doc = ApplicantDocument(
        document_id=uuid.uuid4(),
        applicant_id=applicant.applicant_id,
        document_type="SIGNATURE_PDF",
        file_name=file.filename or safe_filename,
        file_path=file_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc
