from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from services.bgv_service import get_bgv_status, run_verification, get_provider

router = APIRouter(prefix="/api/bgv", tags=["Background Verification"])


@router.get("/onboarding/{onboarding_id}")
def get_bgv_for_onboarding(
    onboarding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.view"),
):
    items = get_bgv_status(db, onboarding_id)
    return {"items": items, "total": len(items)}


@router.post("/verify/{bgv_id}")
def verify_single(
    bgv_id: UUID,
    category: str = Query(...),
    data: Dict[str, Any] = {},
    provider_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("onboarding.verify"),
):
    return run_verification(db, bgv_id, category, data, provider_name)


@router.get("/providers")
def list_providers(
    current_user: User = require_permission("onboarding.view"),
):
    from services.bgv_service import PROVIDERS
    return {"providers": list(PROVIDERS.keys())}
