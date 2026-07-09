"""
Applicant Form Intake Module — Service Layer

Business logic for applicant CRUD, submission workflow, and signature upload.
"""

import os
import re
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload
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
    """Return a query with all relationships eager-loaded.

    to-one relationships use joinedload; to-many use selectinload so that
    loading several collections at once does NOT produce a cartesian-product
    row explosion (which joinedload on multiple collections would).
    """
    return db.query(Applicant).options(
        joinedload(Applicant.professional_details),
        joinedload(Applicant.declaration),
        selectinload(Applicant.employment_history),
        selectinload(Applicant.education),
        selectinload(Applicant.personality_assessment),
        selectinload(Applicant.situational_responses),
        selectinload(Applicant.written_responses),
        selectinload(Applicant.documents),
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
        Applicant.candidate_id == uid
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with ID {applicant_id} not found",
        )
    return applicant


# ---------------------------------------------------------------------------
# CREATE (single atomic submit)
# ---------------------------------------------------------------------------

# The record's first (and only) initial state. There is no server-side DRAFT:
# the wizard lives in the candidate's browser and one row is written on submit.
SUBMITTED_STATUS = "Submitted — awaiting reception"


def _read_and_validate_signature(file: UploadFile) -> bytes:
    """Read the signature upload in bounded chunks and validate it is a real
    PDF within the size limit. Returns the bytes (kept in memory until the DB
    row is committed, so nothing is written to disk on a failed submission)."""
    content = bytearray()
    chunk_size = 64 * 1024
    while True:
        chunk = file.file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > MAX_SIGNATURE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Signature file exceeds maximum limit of 5 MB",
            )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature file is empty",
        )
    if content[:5] != b"%PDF-":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature file is not a valid PDF",
        )
    return bytes(content)


def _add_sections(db: Session, applicant: Applicant, data: ApplicantFullCreate):
    """Add Sections 2-8 rows for a candidate (no commit)."""
    if data.professional_details:
        db.add(ApplicantProfessionalDetail(
            candidate_id=applicant.candidate_id,
            **data.professional_details.model_dump(),
        ))
    for eh in (data.employment_history or []):
        db.add(ApplicantEmploymentHistory(
            candidate_id=applicant.candidate_id, **eh.model_dump()))
    for edu in (data.education or []):
        db.add(ApplicantEducation(
            candidate_id=applicant.candidate_id, **edu.model_dump()))
    for pa in (data.personality_assessment or []):
        db.add(ApplicantPersonalityAssessment(
            candidate_id=applicant.candidate_id, **pa.model_dump()))
    for sr in (data.situational_responses or []):
        db.add(ApplicantSituationalResponse(
            candidate_id=applicant.candidate_id, **sr.model_dump()))
    for wr in (data.written_responses or []):
        db.add(ApplicantWrittenResponse(
            candidate_id=applicant.candidate_id, **wr.model_dump()))
    if data.declaration:
        db.add(ApplicantDeclaration(
            candidate_id=applicant.candidate_id,
            **data.declaration.model_dump(),
        ))


def create_submitted_applicant(
    db: Session, data: ApplicantFullCreate, signature: UploadFile
) -> Applicant:
    """Create a fully-submitted candidate in ONE atomic transaction.

    The multi-step form is filled entirely in the browser; only on final submit
    is a single row (status SUBMITTED) written, together with all sections and
    the signature document. There is no DRAFT — abandoned forms never touch the
    database.
    """
    # 1. Required-section validation (mirrors the old submit-time checks).
    errors = []
    if not data.professional_details:
        errors.append("Section 2 (Professional Details) is required")
    if not data.declaration:
        errors.append("Section 8 (Declaration) is required")
    else:
        if not data.declaration.declaration_accepted:
            errors.append("Declaration must be accepted")
        if not data.declaration.consent_accepted:
            errors.append("Consent must be accepted")
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Application is incomplete.", "errors": errors},
        )

    # 2. Validate the signature fully BEFORE writing anything.
    content = _read_and_validate_signature(signature)

    # 3. Duplicate email check.
    if db.query(Applicant).filter(
        Applicant.email == data.personal_details.email
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An application with email "
                   f"{data.personal_details.email} already exists",
        )

    # 4. Create the candidate + all sections.
    applicant = Applicant(
        application_number=generate_application_number(db),
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
        position_applied_for=data.personal_details.position_applied_for,
        referred_by=data.personal_details.referred_by,
        reference_number=data.personal_details.reference_number,
        status=SUBMITTED_STATUS,
    )
    db.add(applicant)
    db.flush()  # allocate candidate_id
    _add_sections(db, applicant, data)

    # 5. Write the signature file, then record it.
    _ensure_upload_dir()
    orig = os.path.basename(signature.filename or "signature.pdf")
    safe_name = re.sub(r"[^\w\-.]", "_", orig)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    file_path = os.path.join(
        UPLOAD_DIR, f"{applicant.candidate_id}_{timestamp}_{safe_name}")
    with open(file_path, "wb") as f:
        f.write(content)
    db.add(ApplicantDocument(
        candidate_id=applicant.candidate_id,
        document_type="SIGNATURE_PDF",
        file_name=safe_name,
        file_path=file_path,
    ))

    # 6. Commit atomically; clean up the file if the DB write fails.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not submit application (duplicate email or "
                   "application number). Please retry.",
        )
    except Exception:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    return _get_applicant_or_404(db, str(applicant.candidate_id))


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_applicant(db: Session, applicant_id: str) -> Applicant:
    """Retrieve a single applicant with all sections."""
    return _get_applicant_or_404(db, applicant_id)


def list_candidates_advanced(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    gender_filter: Optional[str] = None,
    city_filter: Optional[str] = None,
    state_filter: Optional[str] = None,
    domain_filter: Optional[str] = None,
    search_query: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """List candidates with pagination, filters, search, and sorting."""
    query = db.query(Applicant)
    
    # 1. Filters
    if status_filter:
        query = query.filter(func.lower(Applicant.status) == status_filter.lower())
    if gender_filter:
        query = query.filter(Applicant.gender == gender_filter.upper())
    if city_filter:
        query = query.filter(Applicant.city.ilike(f"%{city_filter}%"))
    if state_filter:
        query = query.filter(Applicant.state.ilike(f"%{state_filter}%"))
    if domain_filter:
        query = query.filter(Applicant.domain.ilike(f"%{domain_filter}%"))
        
    # 2. Search
    if search_query:
        search_term = f"%{search_query}%"
        query = query.filter(
            (Applicant.first_name.ilike(search_term)) |
            (Applicant.last_name.ilike(search_term)) |
            (Applicant.email.ilike(search_term)) |
            (Applicant.phone.ilike(search_term)) |
            (Applicant.application_number.ilike(search_term))
        )
        
    # 3. Sorting
    sort_column = Applicant.created_at
    if sort_by == "experience":
        query = query.outerjoin(ApplicantProfessionalDetail)
        sort_column = ApplicantProfessionalDetail.total_experience
        
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
        
    total = query.count()
    candidates = query.offset(skip).limit(limit).all()
    
    return total, candidates


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

def update_applicant(
    db: Session,
    applicant_id: str,
    data: ApplicantUpdate,
    can_edit_prearrival: bool = False,
    can_edit_any: bool = False,
) -> Applicant:
    """Update an application. Edit authority is expressed as capabilities, not
    role names:
      - can_edit_any        -> edit at any status (admin scope)
      - can_edit_prearrival -> edit up to the pre-arrival window (reception)
      - neither (incl. the anonymous candidate) -> DRAFT only
    Provided sections replace existing data entirely.
    """
    applicant = _get_applicant_or_404(db, applicant_id)

    PREARRIVAL = ("DRAFT", "SUBMITTED", "Submitted — awaiting reception")
    if can_edit_any:
        pass
    elif can_edit_prearrival:
        if applicant.status not in PREARRIVAL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This candidate can no longer be edited before arrival",
            )
    else:
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
                Applicant.candidate_id != applicant.candidate_id,
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
        applicant.position_applied_for = pd.position_applied_for
        applicant.referred_by = pd.referred_by
        applicant.reference_number = pd.reference_number

    # Section 2 — Professional details (replace)
    if data.professional_details is not None:
        if applicant.professional_details:
            db.delete(applicant.professional_details)
            db.flush()
        db.add(ApplicantProfessionalDetail(
            candidate_id=applicant.candidate_id,
            **data.professional_details.model_dump(),
        ))

    # Section 3 — Employment history (replace all)
    if data.employment_history is not None:
        for eh in applicant.employment_history:
            db.delete(eh)
        db.flush()
        for eh in data.employment_history:
            db.add(ApplicantEmploymentHistory(
                candidate_id=applicant.candidate_id,
                **eh.model_dump(),
            ))

    # Section 4 — Education (replace all)
    if data.education is not None:
        for edu in applicant.education:
            db.delete(edu)
        db.flush()
        for edu in data.education:
            db.add(ApplicantEducation(
                candidate_id=applicant.candidate_id,
                **edu.model_dump(),
            ))

    # Section 5 — Personality assessment (replace all)
    if data.personality_assessment is not None:
        for pa in applicant.personality_assessment:
            db.delete(pa)
        db.flush()
        for pa in data.personality_assessment:
            db.add(ApplicantPersonalityAssessment(
                candidate_id=applicant.candidate_id,
                **pa.model_dump(),
            ))

    # Section 6 — Situational responses (replace all)
    if data.situational_responses is not None:
        for sr in applicant.situational_responses:
            db.delete(sr)
        db.flush()
        for sr in data.situational_responses:
            db.add(ApplicantSituationalResponse(
                candidate_id=applicant.candidate_id,
                **sr.model_dump(),
            ))

    # Section 7 — Written responses (replace all)
    if data.written_responses is not None:
        for wr in applicant.written_responses:
            db.delete(wr)
        db.flush()
        for wr in data.written_responses:
            db.add(ApplicantWrittenResponse(
                candidate_id=applicant.candidate_id,
                **wr.model_dump(),
            ))

    # Section 8 — Declaration (replace)
    if data.declaration is not None:
        if applicant.declaration:
            db.delete(applicant.declaration)
            db.flush()
        db.add(ApplicantDeclaration(
            candidate_id=applicant.candidate_id,
            **data.declaration.model_dump(),
        ))

    db.commit()
    return _get_applicant_or_404(db, applicant_id)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

def delete_candidate(db: Session, applicant_id: str) -> bool:
    """Delete a candidate record by ID (cascades automatically)."""
    candidate = _get_applicant_or_404(db, applicant_id)
    db.delete(candidate)
    db.commit()
    return True
