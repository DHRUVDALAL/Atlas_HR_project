from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from services.search_service import global_search
from services.saved_search_service import (
    save_search,
    get_saved_searches,
    delete_saved_search,
    increment_use_count,
)

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("")
def search(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = require_permission("search.view"),
):
    return global_search(db, query=q, search_type=type, skip=skip, limit=limit)


@router.post("/saved")
def save_search_query(
    name: str = Query(...),
    search_type: str = Query(...),
    filters: dict = {},
    is_public: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = require_permission("search.view"),
):
    return save_search(db, user_id=current_user.user_id, name=name, search_type=search_type, filters=filters, is_public=is_public)


@router.get("/saved")
def list_saved(
    db: Session = Depends(get_db),
    current_user: User = require_permission("search.view"),
):
    items = get_saved_searches(db, current_user.user_id)
    return {"items": items, "total": len(items)}


@router.delete("/saved/{search_id}")
def remove_saved(
    search_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("search.view"),
):
    deleted = delete_saved_search(db, search_id, current_user.user_id)
    return {"deleted": deleted}
