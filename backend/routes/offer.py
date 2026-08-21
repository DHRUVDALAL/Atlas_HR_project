"""
Offer Management — FastAPI Routes

API endpoints for offer CRUD, status changes, and dashboard statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from schemas.offer import (
    OfferCreateRequest,
    OfferUpdateRequest,
    OfferStatusRequest,
    OfferResponse,
    OfferListResponse,
    OfferStatsResponse,
    OfferHistoryResponse,
    OfferDocumentResponse,
)
from services.offer_service import (
    create_offer,
    get_offer,
    get_offer_by_candidate,
    list_offers,
    get_offer_stats,
    update_offer,
    send_offer,
    accept_offer,
    decline_offer,
    delete_offer,
    get_offer_history,
    get_offer_documents,
)

router = APIRouter(
    prefix="/api/offers",
    tags=["offers"],
)


# ---------------------------------------------------------------------------
# GET /api/offers/stats — Dashboard statistics
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    summary="Offer dashboard statistics",
    description="Returns offer statistics for the dashboard.",
)
def offer_stats_api(
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    stats = get_offer_stats(db)
    return {"success": True, "data": stats}


# ---------------------------------------------------------------------------
# GET /api/offers — List offers
# ---------------------------------------------------------------------------

@router.get(
    "",
    summary="List offers",
    description="Returns a paginated list of offers with optional filters.",
)
def list_offers_api(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    total, offers = list_offers(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        search_query=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    items = []
    for offer in offers:
        candidate = offer.candidate
        items.append({
            "offer_id": str(offer.offer_id),
            "candidate_id": str(offer.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "status": offer.status,
            "offered_ctc": float(offer.offered_ctc) if offer.offered_ctc else None,
            "joining_date": str(offer.joining_date) if offer.joining_date else None,
            "created_at": str(offer.created_at),
        })

    return {
        "success": True,
        "total": total,
        "data": items,
    }


# ---------------------------------------------------------------------------
# GET /api/offers/{offer_id} — Get offer details
# ---------------------------------------------------------------------------

@router.get(
    "/{offer_id}",
    summary="Get offer details",
    description="Returns full offer details including history and documents.",
)
def get_offer_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    offer = get_offer(db, offer_id)
    candidate = offer.candidate

    return {
        "success": True,
        "data": {
            "offer_id": str(offer.offer_id),
            "candidate_id": str(offer.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "candidate_phone": candidate.phone if candidate else None,
            "status": offer.status,
            "offered_ctc": float(offer.offered_ctc) if offer.offered_ctc else None,
            "joining_date": str(offer.joining_date) if offer.joining_date else None,
            "approved_by": offer.approved_by,
            "sent_at": str(offer.sent_at) if offer.sent_at else None,
            "responded_at": str(offer.responded_at) if offer.responded_at else None,
            "notes": offer.notes,
            "created_by": offer.created_by,
            "created_at": str(offer.created_at),
            "updated_at": str(offer.updated_at),
            "history": [
                {
                    "history_id": str(h.history_id),
                    "action": h.action,
                    "performed_by": h.performed_by,
                    "details": h.details,
                    "created_at": str(h.created_at),
                }
                for h in offer.history
            ],
            "documents": [
                {
                    "document_id": str(d.document_id),
                    "document_type": d.document_type,
                    "file_name": d.file_name,
                    "uploaded_by": d.uploaded_by,
                    "uploaded_at": str(d.uploaded_at),
                }
                for d in offer.documents
            ],
        },
    }


# ---------------------------------------------------------------------------
# GET /api/offers/candidate/{candidate_id} — Get offer by candidate
# ---------------------------------------------------------------------------

@router.get(
    "/candidate/{candidate_id}",
    summary="Get offer by candidate ID",
    description="Returns offer details for a specific candidate.",
)
def get_offer_by_candidate_api(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    offer = get_offer_by_candidate(db, candidate_id)
    candidate = offer.candidate

    return {
        "success": True,
        "data": {
            "offer_id": str(offer.offer_id),
            "candidate_id": str(offer.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "status": offer.status,
            "offered_ctc": float(offer.offered_ctc) if offer.offered_ctc else None,
            "joining_date": str(offer.joining_date) if offer.joining_date else None,
            "approved_by": offer.approved_by,
            "sent_at": str(offer.sent_at) if offer.sent_at else None,
            "responded_at": str(offer.responded_at) if offer.responded_at else None,
            "notes": offer.notes,
            "created_at": str(offer.created_at),
            "updated_at": str(offer.updated_at),
        },
    }


# ---------------------------------------------------------------------------
# POST /api/offers — Create offer
# ---------------------------------------------------------------------------

@router.post(
    "",
    summary="Create offer",
    description="Create a new offer for a candidate in SELECTED status.",
)
def create_offer_api(
    data: OfferCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.create"),
):
    offer = create_offer(
        db=db,
        candidate_id=str(data.candidate_id),
        offered_ctc=data.offered_ctc,
        joining_date=data.joining_date,
        notes=data.notes,
        created_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Offer created successfully",
        "data": {
            "offer_id": str(offer.offer_id),
            "candidate_id": str(offer.candidate_id),
            "status": offer.status,
        },
    }


# ---------------------------------------------------------------------------
# PUT /api/offers/{offer_id} — Update offer
# ---------------------------------------------------------------------------

@router.put(
    "/{offer_id}",
    summary="Update offer",
    description="Update offer details (only DRAFT offers can be edited).",
)
def update_offer_api(
    offer_id: str,
    data: OfferUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.update"),
):
    offer = update_offer(
        db=db,
        offer_id=offer_id,
        offered_ctc=data.offered_ctc,
        joining_date=data.joining_date,
        notes=data.notes,
        performed_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Offer updated successfully",
        "data": {
            "offer_id": str(offer.offer_id),
            "status": offer.status,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/offers/{offer_id}/send — Send offer
# ---------------------------------------------------------------------------

@router.post(
    "/{offer_id}/send",
    summary="Send offer letter",
    description="Send offer letter to candidate (DRAFT → SENT).",
)
def send_offer_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.send"),
):
    offer = send_offer(
        db=db,
        offer_id=offer_id,
        performed_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Offer sent successfully",
        "data": {
            "offer_id": str(offer.offer_id),
            "status": offer.status,
            "sent_at": str(offer.sent_at),
        },
    }


# ---------------------------------------------------------------------------
# POST /api/offers/{offer_id}/accept — Accept offer
# ---------------------------------------------------------------------------

@router.post(
    "/{offer_id}/accept",
    summary="Accept offer",
    description="Accept offer (SENT → ACCEPTED).",
)
def accept_offer_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.approve"),
):
    offer = accept_offer(
        db=db,
        offer_id=offer_id,
        performed_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Offer accepted successfully",
        "data": {
            "offer_id": str(offer.offer_id),
            "status": offer.status,
            "responded_at": str(offer.responded_at),
        },
    }


# ---------------------------------------------------------------------------
# POST /api/offers/{offer_id}/decline — Decline offer
# ---------------------------------------------------------------------------

@router.post(
    "/{offer_id}/decline",
    summary="Decline offer",
    description="Decline offer (SENT → DECLINED).",
)
def decline_offer_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.decline"),
):
    offer = decline_offer(
        db=db,
        offer_id=offer_id,
        performed_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Offer declined",
        "data": {
            "offer_id": str(offer.offer_id),
            "status": offer.status,
            "responded_at": str(offer.responded_at),
        },
    }


# ---------------------------------------------------------------------------
# DELETE /api/offers/{offer_id} — Delete offer
# ---------------------------------------------------------------------------

@router.delete(
    "/{offer_id}",
    summary="Delete offer",
    description="Delete an offer (only DRAFT offers can be deleted).",
)
def delete_offer_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.delete"),
):
    delete_offer(db, offer_id)
    return {"success": True, "message": "Offer deleted successfully"}


# ---------------------------------------------------------------------------
# GET /api/offers/{offer_id}/history — Get offer history
# ---------------------------------------------------------------------------

@router.get(
    "/{offer_id}/history",
    summary="Get offer history",
    description="Returns the history of status changes for an offer.",
)
def get_offer_history_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    history = get_offer_history(db, offer_id)
    return {
        "success": True,
        "data": [
            {
                "history_id": str(h.history_id),
                "action": h.action,
                "performed_by": h.performed_by,
                "details": h.details,
                "created_at": str(h.created_at),
            }
            for h in history
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/offers/{offer_id}/documents — Get offer documents
# ---------------------------------------------------------------------------

@router.get(
    "/{offer_id}/documents",
    summary="Get offer documents",
    description="Returns documents attached to an offer.",
)
def get_offer_documents_api(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("offer.view"),
):
    documents = get_offer_documents(db, offer_id)
    return {
        "success": True,
        "data": [
            {
                "document_id": str(d.document_id),
                "document_type": d.document_type,
                "file_name": d.file_name,
                "uploaded_by": d.uploaded_by,
                "uploaded_at": str(d.uploaded_at),
            }
            for d in documents
        ],
    }
