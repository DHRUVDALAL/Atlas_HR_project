"""
Employee Onboarding — Service Layer

Business logic for onboarding CRUD, document verification, BGV, asset allocation, and checklist.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.applicant import Applicant, CandidateActivityLog
from models.offer_onboarding import (
    Onboarding,
    DocumentVerification,
    BackgroundVerification,
    AssetAllocation,
    EmployeeChecklist,
    OnboardingActivity,
)
from services.applicant_service import _get_applicant_or_404
from services.workflow_service import log_candidate_activity


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_ONBOARDING_STATUSES = {"PENDING", "IN_PROGRESS", "COMPLETED"}
VALID_DOC_TYPES = {"AADHAAR", "PAN", "PASSPORT", "DL", "EDUCATION", "EXPERIENCE", "RESUME", "OFFER_LETTER"}
VALID_BGV_CATEGORIES = {"REFERENCE", "EMPLOYMENT", "EDUCATION", "CRIMINAL"}
VALID_ASSET_TYPES = {"LAPTOP", "MONITOR", "PHONE", "EMAIL", "ACCESS_CARD", "VPN", "SOFTWARE_LICENSES"}
VALID_CHECKLIST_ITEMS = {
    "offer_accepted", "documents_received", "background_complete",
    "it_ready", "payroll_ready", "manager_assigned", "joining_kit", "orientation_scheduled",
}

DOCUMENT_TYPES = ["AADHAAR", "PAN", "PASSPORT", "DL", "EDUCATION", "EXPERIENCE", "RESUME", "OFFER_LETTER"]
BGV_CATEGORIES = ["REFERENCE", "EMPLOYMENT", "EDUCATION", "CRIMINAL"]
ASSET_TYPES = ["LAPTOP", "MONITOR", "PHONE", "EMAIL", "ACCESS_CARD", "VPN", "SOFTWARE_LICENSES"]
CHECKLIST_ITEMS = [
    "offer_accepted", "documents_received", "background_complete",
    "it_ready", "payroll_ready", "manager_assigned", "joining_kit", "orientation_scheduled",
]


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _lock_candidate(db: Session, candidate_id: uuid.UUID) -> None:
    """Take a row lock on the candidate."""
    db.query(Applicant).filter(
        Applicant.candidate_id == candidate_id
    ).with_for_update().first()


def _get_onboarding_or_404(db: Session, onboarding_id: str) -> Onboarding:
    """Fetch an onboarding record by ID or raise 404."""
    try:
        uid = uuid.UUID(onboarding_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid onboarding ID format",
        )

    onboarding = db.query(Onboarding).filter(Onboarding.onboarding_id == uid).first()
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Onboarding with ID {onboarding_id} not found",
        )
    return onboarding


def _get_onboarding_by_candidate(db: Session, candidate_id: str) -> Optional[Onboarding]:
    """Fetch onboarding by candidate ID."""
    try:
        uid = uuid.UUID(candidate_id)
    except ValueError:
        return None
    return db.query(Onboarding).filter(Onboarding.candidate_id == uid).first()


def _log_activity(
    db: Session,
    onboarding_id: uuid.UUID,
    action: str,
    performed_by: str,
    details: Optional[str] = None,
) -> None:
    """Log an onboarding activity."""
    activity = OnboardingActivity(
        activity_id=uuid.uuid4(),
        onboarding_id=onboarding_id,
        action=action,
        performed_by=performed_by,
        details=details,
        created_at=_now_utc(),
    )
    db.add(activity)


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def start_onboarding(
    db: Session,
    candidate_id: str,
    created_by: str,
) -> Onboarding:
    """Start onboarding for a candidate.

    The candidate must have an accepted offer (OFFER_ACCEPTED status).
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    # Validate candidate status
    if candidate.status != "OFFER_ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start onboarding for candidate with status '{candidate.status}'. "
                   "Candidate must have accepted the offer (OFFER_ACCEPTED).",
        )

    # Check if onboarding already exists
    existing = _get_onboarding_by_candidate(db, candidate_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Onboarding already exists for this candidate.",
        )

    # Create onboarding
    onboarding = Onboarding(
        onboarding_id=uuid.uuid4(),
        candidate_id=candidate.candidate_id,
        status="IN_PROGRESS",
        started_at=_now_utc(),
        created_by=created_by,
        created_at=_now_utc(),
        updated_at=_now_utc(),
    )
    db.add(onboarding)
    db.flush()  # Get onboarding_id

    # Create document verification records
    for doc_type in DOCUMENT_TYPES:
        doc_verify = DocumentVerification(
            verification_id=uuid.uuid4(),
            onboarding_id=onboarding.onboarding_id,
            document_type=doc_type,
            status="PENDING",
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        db.add(doc_verify)

    # Create background verification records
    for category in BGV_CATEGORIES:
        bgv = BackgroundVerification(
            bgv_id=uuid.uuid4(),
            onboarding_id=onboarding.onboarding_id,
            category=category,
            status="PENDING",
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        db.add(bgv)

    # Create asset allocation records
    for asset_type in ASSET_TYPES:
        asset = AssetAllocation(
            allocation_id=uuid.uuid4(),
            onboarding_id=onboarding.onboarding_id,
            asset_type=asset_type,
            status="PENDING",
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        db.add(asset)

    # Create checklist records
    for item_name in CHECKLIST_ITEMS:
        checklist = EmployeeChecklist(
            checklist_id=uuid.uuid4(),
            onboarding_id=onboarding.onboarding_id,
            item_name=item_name,
            is_completed=False,
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        db.add(checklist)

    # Update candidate status
    candidate.status = "ONBOARDING_STARTED"

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action="ONBOARDING_STARTED",
        performed_by=created_by,
        details="Onboarding process initiated",
    )

    # Log candidate activity
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Onboarding Started",
        performed_by=created_by,
        details="Onboarding process initiated",
    )

    db.commit()
    db.refresh(onboarding)
    return onboarding


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_onboarding(db: Session, onboarding_id: str) -> Onboarding:
    """Retrieve a single onboarding record with all details."""
    return _get_onboarding_or_404(db, onboarding_id)


def get_onboarding_by_candidate(db: Session, candidate_id: str) -> Onboarding:
    """Retrieve onboarding by candidate ID."""
    onboarding = _get_onboarding_by_candidate(db, candidate_id)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No onboarding found for candidate {candidate_id}",
        )
    return onboarding


def list_onboardings(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    search_query: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[int, List]:
    """List onboarding records with pagination, filters, and search."""
    query = db.query(Onboarding).join(Applicant, Onboarding.candidate_id == Applicant.candidate_id)

    # Filter by status
    if status_filter:
        query = query.filter(func.lower(Onboarding.status) == status_filter.lower())

    # Search
    if search_query:
        search_term = f"%{search_query}%"
        query = query.filter(
            (Applicant.first_name.ilike(search_term)) |
            (Applicant.last_name.ilike(search_term)) |
            (Applicant.email.ilike(search_term)) |
            (Applicant.application_number.ilike(search_term))
        )

    # Sorting
    sort_column = Onboarding.created_at
    if sort_by == "status":
        sort_column = Onboarding.status

    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    onboardings = query.offset(skip).limit(limit).all()

    return total, onboardings


def get_onboarding_stats(db: Session) -> dict:
    """Get dashboard statistics for onboarding."""
    total = db.query(func.count(Onboarding.onboarding_id)).scalar() or 0
    in_progress = db.query(func.count(Onboarding.onboarding_id)).filter(
        Onboarding.status == "IN_PROGRESS"
    ).scalar() or 0
    completed = db.query(func.count(Onboarding.onboarding_id)).filter(
        Onboarding.status == "COMPLETED"
    ).scalar() or 0

    # Documents pending
    docs_pending = db.query(func.count(DocumentVerification.verification_id)).filter(
        DocumentVerification.status == "PENDING"
    ).scalar() or 0

    # BGV pending
    bgv_pending = db.query(func.count(BackgroundVerification.bgv_id)).filter(
        BackgroundVerification.status == "PENDING"
    ).scalar() or 0

    # Assets pending
    assets_pending = db.query(func.count(AssetAllocation.allocation_id)).filter(
        AssetAllocation.status == "PENDING"
    ).scalar() or 0

    # This month
    now = _now_utc()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = db.query(func.count(Onboarding.onboarding_id)).filter(
        Onboarding.created_at >= first_of_month
    ).scalar() or 0

    return {
        "total_employees": total,
        "in_progress": in_progress,
        "completed": completed,
        "documents_pending": docs_pending,
        "bgv_pending": bgv_pending,
        "assets_pending": assets_pending,
        "onboarding_this_month": this_month,
    }


# ---------------------------------------------------------------------------
# CHECKLIST
# ---------------------------------------------------------------------------

def get_checklist(db: Session, onboarding_id: str) -> List[EmployeeChecklist]:
    """Get checklist items for an onboarding."""
    _get_onboarding_or_404(db, onboarding_id)  # Validate exists
    return (
        db.query(EmployeeChecklist)
        .filter(EmployeeChecklist.onboarding_id == uuid.UUID(onboarding_id))
        .order_by(EmployeeChecklist.created_at)
        .all()
    )


def update_checklist_item(
    db: Session,
    onboarding_id: str,
    item_name: str,
    is_completed: bool,
    performed_by: str,
) -> EmployeeChecklist:
    """Update a checklist item."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if item_name not in VALID_CHECKLIST_ITEMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid checklist item: {item_name}",
        )

    item = (
        db.query(EmployeeChecklist)
        .filter(
            EmployeeChecklist.onboarding_id == uuid.UUID(onboarding_id),
            EmployeeChecklist.item_name == item_name,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item '{item_name}' not found",
        )

    item.is_completed = is_completed
    if is_completed:
        item.completed_by = performed_by
        item.completed_at = _now_utc()
    else:
        item.completed_by = None
        item.completed_at = None

    item.updated_at = _now_utc()

    # Log activity
    action = f"CHECKLIST_ITEM_{'COMPLETED' if is_completed else 'UNCHECKED'}"
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=action,
        performed_by=performed_by,
        details=f"Checklist item '{item_name}' {'completed' if is_completed else 'unchecked'}",
    )

    # Check if all items completed → auto-complete onboarding
    all_items = db.query(EmployeeChecklist).filter(
        EmployeeChecklist.onboarding_id == uuid.UUID(onboarding_id)
    ).all()
    all_completed = all(i.is_completed for i in all_items)

    if all_completed and onboarding.status != "COMPLETED":
        onboarding.status = "COMPLETED"
        onboarding.completed_at = _now_utc()
        onboarding.updated_at = _now_utc()

        _log_activity(
            db=db,
            onboarding_id=onboarding.onboarding_id,
            action="ONBOARDING_COMPLETED",
            performed_by=performed_by,
            details="All checklist items completed. Onboarding auto-completed.",
        )

        # Update candidate status
        candidate = _get_applicant_or_404(db, str(onboarding.candidate_id))
        candidate.status = "EMPLOYEE_ACTIVATED"

        log_candidate_activity(
            db=db,
            candidate_id=onboarding.candidate_id,
            action="Onboarding Completed",
            performed_by=performed_by,
            details="All checklist items completed. Employee activated.",
        )

    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# DOCUMENT VERIFICATION
# ---------------------------------------------------------------------------

def verify_document(
    db: Session,
    onboarding_id: str,
    doc_type: str,
    verified_by: str,
    notes: Optional[str],
) -> DocumentVerification:
    """Verify a document."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if doc_type not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type: {doc_type}",
        )

    doc = (
        db.query(DocumentVerification)
        .filter(
            DocumentVerification.onboarding_id == uuid.UUID(onboarding_id),
            DocumentVerification.document_type == doc_type,
        )
        .first()
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document verification record for '{doc_type}' not found",
        )

    doc.status = "VERIFIED"
    doc.verified_by = verified_by
    doc.verified_at = _now_utc()
    doc.notes = notes
    doc.updated_at = _now_utc()

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=f"DOCUMENT_VERIFIED_{doc_type}",
        performed_by=verified_by,
        details=f"Document '{doc_type}' verified. Notes: {notes}",
    )

    db.commit()
    db.refresh(doc)
    return doc


def reject_document(
    db: Session,
    onboarding_id: str,
    doc_type: str,
    verified_by: str,
    notes: Optional[str],
) -> DocumentVerification:
    """Reject a document."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if doc_type not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type: {doc_type}",
        )

    doc = (
        db.query(DocumentVerification)
        .filter(
            DocumentVerification.onboarding_id == uuid.UUID(onboarding_id),
            DocumentVerification.document_type == doc_type,
        )
        .first()
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document verification record for '{doc_type}' not found",
        )

    doc.status = "REJECTED"
    doc.verified_by = verified_by
    doc.verified_at = _now_utc()
    doc.notes = notes
    doc.updated_at = _now_utc()

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=f"DOCUMENT_REJECTED_{doc_type}",
        performed_by=verified_by,
        details=f"Document '{doc_type}' rejected. Notes: {notes}",
    )

    db.commit()
    db.refresh(doc)
    return doc


# ---------------------------------------------------------------------------
# BACKGROUND VERIFICATION
# ---------------------------------------------------------------------------

def clear_bgv(
    db: Session,
    onboarding_id: str,
    category: str,
    verified_by: str,
    notes: Optional[str],
) -> BackgroundVerification:
    """Clear a background check."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if category not in VALID_BGV_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid BGV category: {category}",
        )

    bgv = (
        db.query(BackgroundVerification)
        .filter(
            BackgroundVerification.onboarding_id == uuid.UUID(onboarding_id),
            BackgroundVerification.category == category,
        )
        .first()
    )

    if not bgv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Background verification record for '{category}' not found",
        )

    bgv.status = "CLEARED"
    bgv.verified_by = verified_by
    bgv.verified_at = _now_utc()
    bgv.notes = notes
    bgv.updated_at = _now_utc()

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=f"BGV_CLEARED_{category}",
        performed_by=verified_by,
        details=f"Background check '{category}' cleared. Notes: {notes}",
    )

    db.commit()
    db.refresh(bgv)
    return bgv


def fail_bgv(
    db: Session,
    onboarding_id: str,
    category: str,
    verified_by: str,
    notes: Optional[str],
) -> BackgroundVerification:
    """Fail a background check."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if category not in VALID_BGV_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid BGV category: {category}",
        )

    bgv = (
        db.query(BackgroundVerification)
        .filter(
            BackgroundVerification.onboarding_id == uuid.UUID(onboarding_id),
            BackgroundVerification.category == category,
        )
        .first()
    )

    if not bgv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Background verification record for '{category}' not found",
        )

    bgv.status = "FAILED"
    bgv.verified_by = verified_by
    bgv.verified_at = _now_utc()
    bgv.notes = notes
    bgv.updated_at = _now_utc()

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=f"BGV_FAILED_{category}",
        performed_by=verified_by,
        details=f"Background check '{category}' failed. Notes: {notes}",
    )

    db.commit()
    db.refresh(bgv)
    return bgv


# ---------------------------------------------------------------------------
# ASSET ALLOCATION
# ---------------------------------------------------------------------------

def allocate_asset(
    db: Session,
    onboarding_id: str,
    asset_type: str,
    asset_id: Optional[str],
    allocated_by: str,
    notes: Optional[str],
) -> AssetAllocation:
    """Allocate an IT asset."""
    onboarding = _get_onboarding_or_404(db, onboarding_id)

    if asset_type not in VALID_ASSET_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid asset type: {asset_type}",
        )

    asset = (
        db.query(AssetAllocation)
        .filter(
            AssetAllocation.onboarding_id == uuid.UUID(onboarding_id),
            AssetAllocation.asset_type == asset_type,
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset allocation record for '{asset_type}' not found",
        )

    asset.status = "ALLOCATED"
    asset.asset_id = asset_id
    asset.allocated_by = allocated_by
    asset.allocated_at = _now_utc()
    asset.notes = notes
    asset.updated_at = _now_utc()

    # Log activity
    _log_activity(
        db=db,
        onboarding_id=onboarding.onboarding_id,
        action=f"ASSET_ALLOCATED_{asset_type}",
        performed_by=allocated_by,
        details=f"Asset '{asset_type}' allocated. Asset ID: {asset_id}. Notes: {notes}",
    )

    db.commit()
    db.refresh(asset)
    return asset


def get_assets(db: Session, onboarding_id: str) -> List[AssetAllocation]:
    """Get asset allocation records."""
    _get_onboarding_or_404(db, onboarding_id)  # Validate exists
    return (
        db.query(AssetAllocation)
        .filter(AssetAllocation.onboarding_id == uuid.UUID(onboarding_id))
        .order_by(AssetAllocation.created_at)
        .all()
    )
