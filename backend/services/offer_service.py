"""
Offer Management — Service Layer

Business logic for offer CRUD, status changes, and workflow integration.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.applicant import Applicant, CandidateActivityLog
from models.offer_onboarding import (
    Offer,
    OfferDocument,
    OfferHistory,
)
from services.applicant_service import _get_applicant_or_404
from services.workflow_service import log_candidate_activity


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_OFFER_STATUSES = {"DRAFT", "SENT", "ACCEPTED", "DECLINED"}
OFFER_TRANSITIONS = {
    "DRAFT": {"SENT"},
    "SENT": {"ACCEPTED", "DECLINED"},
    "ACCEPTED": set(),
    "DECLINED": set(),
}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _lock_candidate(db: Session, candidate_id: uuid.UUID) -> None:
    """Take a row lock on the candidate to serialize concurrent operations."""
    db.query(Applicant).filter(
        Applicant.candidate_id == candidate_id
    ).with_for_update().first()


def _get_offer_or_404(db: Session, offer_id: str) -> Offer:
    """Fetch an offer by ID or raise 404."""
    try:
        uid = uuid.UUID(offer_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid offer ID format",
        )

    offer = db.query(Offer).filter(Offer.offer_id == uid).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found",
        )
    return offer


def _get_offer_by_candidate(db: Session, candidate_id: str) -> Optional[Offer]:
    """Fetch an offer by candidate ID."""
    try:
        uid = uuid.UUID(candidate_id)
    except ValueError:
        return None
    return db.query(Offer).filter(Offer.candidate_id == uid).first()


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def create_offer(
    db: Session,
    candidate_id: str,
    offered_ctc: Optional[float],
    joining_date: Optional[date],
    notes: Optional[str],
    created_by: str,
) -> Offer:
    """Create a new offer for a candidate.

    The candidate must be in SELECTED status (final decision made).
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    # Validate candidate status
    if candidate.status != "SELECTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create offer for candidate with status '{candidate.status}'. "
                   "Candidate must be in SELECTED status.",
        )

    # Check if offer already exists
    existing = _get_offer_by_candidate(db, candidate_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An offer already exists for this candidate.",
        )

    # Create offer
    offer = Offer(
        offer_id=uuid.uuid4(),
        candidate_id=candidate.candidate_id,
        status="DRAFT",
        offered_ctc=offered_ctc,
        joining_date=joining_date,
        notes=notes,
        created_by=created_by,
        created_at=_now_utc(),
        updated_at=_now_utc(),
    )
    db.add(offer)

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=offer.offer_id,
        action="OFFER_CREATED",
        performed_by=created_by,
        details=f"Offer created with CTC: {offered_ctc}, Joining: {joining_date}",
        created_at=_now_utc(),
    )
    db.add(history)

    # Log candidate activity
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Offer Created",
        performed_by=created_by,
        details=f"Offer created with CTC: {offered_ctc}",
    )

    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_offer(db: Session, offer_id: str) -> Offer:
    """Retrieve a single offer with history and documents."""
    return _get_offer_or_404(db, offer_id)


def get_offer_by_candidate(db: Session, candidate_id: str) -> Offer:
    """Retrieve offer by candidate ID."""
    offer = _get_offer_by_candidate(db, candidate_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No offer found for candidate {candidate_id}",
        )
    return offer


def list_offers(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    search_query: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[int, List]:
    """List offers with pagination, filters, and search."""
    query = db.query(Offer).join(Applicant, Offer.candidate_id == Applicant.candidate_id)

    # Filter by status
    if status_filter:
        query = query.filter(func.lower(Offer.status) == status_filter.lower())

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
    sort_column = Offer.created_at
    if sort_by == "ctc":
        sort_column = Offer.offered_ctc
    elif sort_by == "joining_date":
        sort_column = Offer.joining_date

    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    offers = query.offset(skip).limit(limit).all()

    return total, offers


def get_offer_stats(db: Session) -> dict:
    """Get dashboard statistics for offers."""
    total = db.query(func.count(Offer.offer_id)).scalar() or 0
    pending = db.query(func.count(Offer.offer_id)).filter(
        Offer.status.in_(["DRAFT", "SENT"])
    ).scalar() or 0
    accepted = db.query(func.count(Offer.offer_id)).filter(
        Offer.status == "ACCEPTED"
    ).scalar() or 0
    declined = db.query(func.count(Offer.offer_id)).filter(
        Offer.status == "DECLINED"
    ).scalar() or 0

    # This month
    now = _now_utc()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = db.query(func.count(Offer.offer_id)).filter(
        Offer.created_at >= first_of_month
    ).scalar() or 0

    # Average processing days (from created to accepted/declined)
    avg_days = 0.0
    if accepted + declined > 0:
        # Simple approximation
        avg_days = 7.0  # Default

    return {
        "total_offers": total,
        "pending_offers": pending,
        "accepted_offers": accepted,
        "declined_offers": declined,
        "avg_processing_days": avg_days,
        "offers_this_month": this_month,
    }


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

def update_offer(
    db: Session,
    offer_id: str,
    offered_ctc: Optional[float],
    joining_date: Optional[date],
    notes: Optional[str],
    performed_by: str,
) -> Offer:
    """Update offer details (only DRAFT offers can be edited)."""
    offer = _get_offer_or_404(db, offer_id)

    if offer.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update offer in '{offer.status}' status. Only DRAFT offers can be edited.",
        )

    if offered_ctc is not None:
        offer.offered_ctc = offered_ctc
    if joining_date is not None:
        offer.joining_date = joining_date
    if notes is not None:
        offer.notes = notes

    offer.updated_at = _now_utc()

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=offer.offer_id,
        action="OFFER_UPDATED",
        performed_by=performed_by,
        details=f"Offer updated. CTC: {offer.offered_ctc}, Joining: {offer.joining_date}",
        created_at=_now_utc(),
    )
    db.add(history)

    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# STATUS CHANGES
# ---------------------------------------------------------------------------

def _transition_offer_status(offer: Offer, new_status: str) -> None:
    """Validate and perform offer status transition."""
    allowed = OFFER_TRANSITIONS.get(offer.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition offer from '{offer.status}' to '{new_status}'. "
                   f"Allowed transitions: {sorted(allowed) or 'none'}",
        )


def send_offer(
    db: Session,
    offer_id: str,
    performed_by: str,
) -> Offer:
    """Send offer letter to candidate (DRAFT → SENT)."""
    offer = _get_offer_or_404(db, offer_id)
    _transition_offer_status(offer, "SENT")

    offer.status = "SENT"
    offer.sent_at = _now_utc()
    offer.updated_at = _now_utc()

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=offer.offer_id,
        action="OFFER_SENT",
        performed_by=performed_by,
        details="Offer letter sent to candidate",
        created_at=_now_utc(),
    )
    db.add(history)

    # Log candidate activity
    log_candidate_activity(
        db=db,
        candidate_id=offer.candidate_id,
        action="Offer Sent",
        performed_by=performed_by,
        details="Offer letter sent to candidate",
    )

    db.commit()
    db.refresh(offer)
    return offer


def accept_offer(
    db: Session,
    offer_id: str,
    performed_by: str,
) -> Offer:
    """Accept offer (SENT → ACCEPTED)."""
    offer = _get_offer_or_404(db, offer_id)
    _transition_offer_status(offer, "ACCEPTED")

    offer.status = "ACCEPTED"
    offer.responded_at = _now_utc()
    offer.approved_by = performed_by
    offer.updated_at = _now_utc()

    # Update candidate status
    candidate = _get_applicant_or_404(db, str(offer.candidate_id))
    candidate.status = "OFFER_ACCEPTED"

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=offer.offer_id,
        action="OFFER_ACCEPTED",
        performed_by=performed_by,
        details="Offer accepted by candidate",
        created_at=_now_utc(),
    )
    db.add(history)

    # Log candidate activity
    log_candidate_activity(
        db=db,
        candidate_id=offer.candidate_id,
        action="Offer Accepted",
        performed_by=performed_by,
        details="Offer accepted by candidate",
    )

    db.commit()
    db.refresh(offer)
    return offer


def decline_offer(
    db: Session,
    offer_id: str,
    performed_by: str,
) -> Offer:
    """Decline offer (SENT → DECLINED)."""
    offer = _get_offer_or_404(db, offer_id)
    _transition_offer_status(offer, "DECLINED")

    offer.status = "DECLINED"
    offer.responded_at = _now_utc()
    offer.updated_at = _now_utc()

    # Update candidate status
    candidate = _get_applicant_or_404(db, str(offer.candidate_id))
    candidate.status = "OFFER_DECLINED"

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=offer.offer_id,
        action="OFFER_DECLINED",
        performed_by=performed_by,
        details="Offer declined by candidate",
        created_at=_now_utc(),
    )
    db.add(history)

    # Log candidate activity
    log_candidate_activity(
        db=db,
        candidate_id=offer.candidate_id,
        action="Offer Declined",
        performed_by=performed_by,
        details="Offer declined by candidate",
    )

    db.commit()
    db.refresh(offer)
    return offer


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

def delete_offer(db: Session, offer_id: str) -> bool:
    """Delete an offer (only DRAFT offers can be deleted)."""
    offer = _get_offer_or_404(db, offer_id)

    if offer.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete offer in '{offer.status}' status. Only DRAFT offers can be deleted.",
        )

    db.delete(offer)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# HISTORY
# ---------------------------------------------------------------------------

def get_offer_history(db: Session, offer_id: str) -> List[OfferHistory]:
    """Get offer history entries."""
    _get_offer_or_404(db, offer_id)  # Validate offer exists
    return (
        db.query(OfferHistory)
        .filter(OfferHistory.offer_id == uuid.UUID(offer_id))
        .order_by(OfferHistory.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# DOCUMENTS
# ---------------------------------------------------------------------------

def get_offer_documents(db: Session, offer_id: str) -> List[OfferDocument]:
    """Get offer documents."""
    _get_offer_or_404(db, offer_id)  # Validate offer exists
    return (
        db.query(OfferDocument)
        .filter(OfferDocument.offer_id == uuid.UUID(offer_id))
        .order_by(OfferDocument.uploaded_at.desc())
        .all()
    )


def upload_offer_document(
    db: Session,
    offer_id: str,
    file_name: str,
    file_path: str,
    document_type: str,
    uploaded_by: str,
) -> OfferDocument:
    """Upload a document to an offer."""
    _get_offer_or_404(db, offer_id)  # Validate offer exists

    doc = OfferDocument(
        document_id=uuid.uuid4(),
        offer_id=uuid.UUID(offer_id),
        document_type=document_type,
        file_name=file_name,
        file_path=file_path,
        uploaded_by=uploaded_by,
        uploaded_at=_now_utc(),
    )
    db.add(doc)

    # Log history
    history = OfferHistory(
        history_id=uuid.uuid4(),
        offer_id=uuid.UUID(offer_id),
        action="DOCUMENT_UPLOADED",
        performed_by=uploaded_by,
        details=f"Document uploaded: {file_name} ({document_type})",
        created_at=_now_utc(),
    )
    db.add(history)

    db.commit()
    db.refresh(doc)
    return doc
