"""
Employee Onboarding — FastAPI Routes

API endpoints for onboarding CRUD, document verification, BGV, asset allocation, and checklist.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from schemas.onboarding import (
    OnboardingStartRequest,
    OnboardingUpdateRequest,
    ChecklistUpdateRequest,
    DocumentVerifyRequest,
    BGVUpdateRequest,
    AssetAllocateRequest,
    OnboardingResponse,
    OnboardingListResponse,
    OnboardingStatsResponse,
    VerificationItemResponse,
    AssetItemResponse,
    ChecklistItemResponse,
    OnboardingActivityResponse,
)
from services.onboarding_service import (
    start_onboarding,
    get_onboarding,
    get_onboarding_by_candidate,
    list_onboardings,
    get_onboarding_stats,
    get_checklist,
    update_checklist_item,
    verify_document,
    reject_document,
    clear_bgv,
    fail_bgv,
    allocate_asset,
    get_assets,
)

router = APIRouter(
    prefix="/api/onboarding",
    tags=["onboarding"],
)


# ---------------------------------------------------------------------------
# GET /api/onboarding/stats — Dashboard statistics
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    summary="Onboarding dashboard statistics",
    description="Returns onboarding statistics for the dashboard.",
)
def onboarding_stats_api(
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    stats = get_onboarding_stats(db)
    return {"success": True, "data": stats}


# ---------------------------------------------------------------------------
# GET /api/onboarding — List onboarding records
# ---------------------------------------------------------------------------

@router.get(
    "",
    summary="List onboarding records",
    description="Returns a paginated list of onboarding records with optional filters.",
)
def list_onboardings_api(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    total, onboardings = list_onboardings(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        search_query=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    items = []
    for onb in onboardings:
        candidate = onb.candidate
        # Calculate progress
        checklist_items = [c for c in onb.checklist]
        completed = sum(1 for c in checklist_items if c.is_completed)
        total_items = len(checklist_items)
        progress = int((completed / total_items * 100)) if total_items > 0 else 0

        items.append({
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "status": onb.status,
            "started_at": str(onb.started_at) if onb.started_at else None,
            "completed_at": str(onb.completed_at) if onb.completed_at else None,
            "created_at": str(onb.created_at),
            "progress_percent": progress,
        })

    return {
        "success": True,
        "total": total,
        "data": items,
    }


# ---------------------------------------------------------------------------
# GET /api/onboarding/{onboarding_id} — Get onboarding details
# ---------------------------------------------------------------------------

@router.get(
    "/{onboarding_id}",
    summary="Get onboarding details",
    description="Returns full onboarding details including documents, BGV, assets, and checklist.",
)
def get_onboarding_api(
    onboarding_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    onb = get_onboarding(db, onboarding_id)
    candidate = onb.candidate

    # Calculate progress
    checklist_items = [c for c in onb.checklist]
    completed = sum(1 for c in checklist_items if c.is_completed)
    total_items = len(checklist_items)
    progress = int((completed / total_items * 100)) if total_items > 0 else 0

    return {
        "success": True,
        "data": {
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "candidate_phone": candidate.phone if candidate else None,
            "position_applied": candidate.position_applied_for if candidate else None,
            "status": onb.status,
            "started_at": str(onb.started_at) if onb.started_at else None,
            "completed_at": str(onb.completed_at) if onb.completed_at else None,
            "created_by": onb.created_by,
            "created_at": str(onb.created_at),
            "updated_at": str(onb.updated_at),
            "progress_percent": progress,
            "documents": [
                {
                    "document_type": d.document_type,
                    "status": d.status,
                    "verified_by": d.verified_by,
                    "verified_at": str(d.verified_at) if d.verified_at else None,
                    "notes": d.notes,
                }
                for d in onb.documents
            ],
            "background_checks": [
                {
                    "category": b.category,
                    "status": b.status,
                    "verified_by": b.verified_by,
                    "verified_at": str(b.verified_at) if b.verified_at else None,
                    "notes": b.notes,
                }
                for b in onb.background_checks
            ],
            "assets": [
                {
                    "asset_type": a.asset_type,
                    "status": a.status,
                    "asset_id": a.asset_id,
                    "allocated_by": a.allocated_by,
                    "allocated_at": str(a.allocated_at) if a.allocated_at else None,
                    "notes": a.notes,
                }
                for a in onb.assets
            ],
            "checklist": [
                {
                    "item_name": c.item_name,
                    "is_completed": c.is_completed,
                    "completed_by": c.completed_by,
                    "completed_at": str(c.completed_at) if c.completed_at else None,
                }
                for c in onb.checklist
            ],
            "activities": [
                {
                    "activity_id": str(a.activity_id),
                    "action": a.action,
                    "performed_by": a.performed_by,
                    "details": a.details,
                    "created_at": str(a.created_at),
                }
                for a in onb.activities
            ],
        },
    }


# ---------------------------------------------------------------------------
# GET /api/onboarding/candidate/{candidate_id} — Get onboarding by candidate
# ---------------------------------------------------------------------------

@router.get(
    "/candidate/{candidate_id}",
    summary="Get onboarding by candidate ID",
    description="Returns onboarding details for a specific candidate.",
)
def get_onboarding_by_candidate_api(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    onb = get_onboarding_by_candidate(db, candidate_id)
    candidate = onb.candidate

    return {
        "success": True,
        "data": {
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
            "application_number": candidate.application_number if candidate else None,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else None,
            "candidate_email": candidate.email if candidate else None,
            "status": onb.status,
            "started_at": str(onb.started_at) if onb.started_at else None,
            "completed_at": str(onb.completed_at) if onb.completed_at else None,
            "created_at": str(onb.created_at),
            "updated_at": str(onb.updated_at),
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding — Start onboarding
# ---------------------------------------------------------------------------

@router.post(
    "",
    summary="Start onboarding",
    description="Start onboarding for a candidate with OFFER_ACCEPTED status.",
)
def start_onboarding_api(
    data: OnboardingStartRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.manage"),
):
    onb = start_onboarding(
        db=db,
        candidate_id=str(data.candidate_id),
        created_by=current_user.email,
    )

    return {
        "success": True,
        "message": "Onboarding started successfully",
        "data": {
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
            "status": onb.status,
        },
    }


# ---------------------------------------------------------------------------
# PUT /api/onboarding/{onboarding_id} — Update onboarding status
# ---------------------------------------------------------------------------

@router.put(
    "/{onboarding_id}",
    summary="Update onboarding",
    description="Update onboarding status.",
)
def update_onboarding_api(
    onboarding_id: str,
    data: OnboardingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.manage"),
):
    from services.onboarding_service import _get_onboarding_or_404
    from datetime import datetime, timezone

    onb = _get_onboarding_or_404(db, onboarding_id)

    if data.status:
        if data.status not in ("PENDING", "IN_PROGRESS", "COMPLETED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {data.status}",
            )
        onb.status = data.status
        if data.status == "COMPLETED":
            onb.completed_at = datetime.now(timezone.utc)

    onb.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(onb)

    return {
        "success": True,
        "message": "Onboarding updated successfully",
        "data": {
            "onboarding_id": str(onb.onboarding_id),
            "status": onb.status,
        },
    }


# ---------------------------------------------------------------------------
# GET /api/onboarding/{onboarding_id}/checklist — Get checklist
# ---------------------------------------------------------------------------

@router.get(
    "/{onboarding_id}/checklist",
    summary="Get checklist",
    description="Returns the onboarding checklist items.",
)
def get_checklist_api(
    onboarding_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    checklist = get_checklist(db, onboarding_id)
    return {
        "success": True,
        "data": [
            {
                "item_name": c.item_name,
                "is_completed": c.is_completed,
                "completed_by": c.completed_by,
                "completed_at": str(c.completed_at) if c.completed_at else None,
            }
            for c in checklist
        ],
    }


# ---------------------------------------------------------------------------
# PUT /api/onboarding/{onboarding_id}/checklist/{item_name} — Update checklist item
# ---------------------------------------------------------------------------

@router.put(
    "/{onboarding_id}/checklist/{item_name}",
    summary="Update checklist item",
    description="Update a specific checklist item.",
)
def update_checklist_item_api(
    onboarding_id: str,
    item_name: str,
    data: ChecklistUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.manage"),
):
    item = update_checklist_item(
        db=db,
        onboarding_id=onboarding_id,
        item_name=item_name,
        is_completed=data.is_completed,
        performed_by=current_user.email,
    )

    return {
        "success": True,
        "message": f"Checklist item '{item_name}' updated",
        "data": {
            "item_name": item.item_name,
            "is_completed": item.is_completed,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding/{onboarding_id}/documents/{doc_type}/verify — Verify document
# ---------------------------------------------------------------------------

@router.post(
    "/{onboarding_id}/documents/{doc_type}/verify",
    summary="Verify document",
    description="Mark a document as verified.",
)
def verify_document_api(
    onboarding_id: str,
    doc_type: str,
    data: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.verify"),
):
    doc = verify_document(
        db=db,
        onboarding_id=onboarding_id,
        doc_type=doc_type.upper(),
        verified_by=current_user.email,
        notes=data.notes,
    )

    return {
        "success": True,
        "message": f"Document '{doc_type}' verified",
        "data": {
            "document_type": doc.document_type,
            "status": doc.status,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding/{onboarding_id}/documents/{doc_type}/reject — Reject document
# ---------------------------------------------------------------------------

@router.post(
    "/{onboarding_id}/documents/{doc_type}/reject",
    summary="Reject document",
    description="Mark a document as rejected.",
)
def reject_document_api(
    onboarding_id: str,
    doc_type: str,
    data: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.verify"),
):
    doc = reject_document(
        db=db,
        onboarding_id=onboarding_id,
        doc_type=doc_type.upper(),
        verified_by=current_user.email,
        notes=data.notes,
    )

    return {
        "success": True,
        "message": f"Document '{doc_type}' rejected",
        "data": {
            "document_type": doc.document_type,
            "status": doc.status,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding/{onboarding_id}/bgv/{category}/clear — Clear BGV
# ---------------------------------------------------------------------------

@router.post(
    "/{onboarding_id}/bgv/{category}/clear",
    summary="Clear background check",
    description="Mark a background check as cleared.",
)
def clear_bgv_api(
    onboarding_id: str,
    category: str,
    data: BGVUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.verify"),
):
    bgv = clear_bgv(
        db=db,
        onboarding_id=onboarding_id,
        category=category.upper(),
        verified_by=current_user.email,
        notes=data.notes,
    )

    return {
        "success": True,
        "message": f"Background check '{category}' cleared",
        "data": {
            "category": bgv.category,
            "status": bgv.status,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding/{onboarding_id}/bgv/{category}/fail — Fail BGV
# ---------------------------------------------------------------------------

@router.post(
    "/{onboarding_id}/bgv/{category}/fail",
    summary="Fail background check",
    description="Mark a background check as failed.",
)
def fail_bgv_api(
    onboarding_id: str,
    category: str,
    data: BGVUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.verify"),
):
    bgv = fail_bgv(
        db=db,
        onboarding_id=onboarding_id,
        category=category.upper(),
        verified_by=current_user.email,
        notes=data.notes,
    )

    return {
        "success": True,
        "message": f"Background check '{category}' failed",
        "data": {
            "category": bgv.category,
            "status": bgv.status,
        },
    }


# ---------------------------------------------------------------------------
# POST /api/onboarding/{onboarding_id}/assets/{asset_type}/allocate — Allocate asset
# ---------------------------------------------------------------------------

@router.post(
    "/{onboarding_id}/assets/{asset_type}/allocate",
    summary="Allocate IT asset",
    description="Allocate an IT asset to the employee.",
)
def allocate_asset_api(
    onboarding_id: str,
    asset_type: str,
    data: AssetAllocateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.allocate"),
):
    asset = allocate_asset(
        db=db,
        onboarding_id=onboarding_id,
        asset_type=asset_type.upper(),
        asset_id=data.asset_id,
        allocated_by=current_user.email,
        notes=data.notes,
    )

    return {
        "success": True,
        "message": f"Asset '{asset_type}' allocated",
        "data": {
            "asset_type": asset.asset_type,
            "status": asset.status,
            "asset_id": asset.asset_id,
        },
    }


# ---------------------------------------------------------------------------
# GET /api/onboarding/{onboarding_id}/assets — Get assets
# ---------------------------------------------------------------------------

@router.get(
    "/{onboarding_id}/assets",
    summary="Get allocated assets",
    description="Returns the IT asset allocation records.",
)
def get_assets_api(
    onboarding_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    assets = get_assets(db, onboarding_id)
    return {
        "success": True,
        "data": [
            {
                "asset_type": a.asset_type,
                "status": a.status,
                "asset_id": a.asset_id,
                "allocated_by": a.allocated_by,
                "allocated_at": str(a.allocated_at) if a.allocated_at else None,
                "notes": a.notes,
            }
            for a in assets
        ],
    }
