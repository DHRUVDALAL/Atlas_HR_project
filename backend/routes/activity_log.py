from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from services.activity_log_service import (
    get_activity_logs,
    get_entity_history,
    get_user_activity,
    get_action_stats,
)

router = APIRouter(prefix="/api/activity-logs", tags=["Activity Logs"])


@router.get("")
def list_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    user_id: Optional[UUID] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("activity.view"),
):
    items, total = get_activity_logs(
        db, skip=skip, limit=limit, action=action,
        entity_type=entity_type, entity_id=entity_id,
        user_id=user_id, start_date=start_date,
        end_date=end_date, search=search,
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/entity/{entity_type}/{entity_id}")
def entity_history(
    entity_type: str,
    entity_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = require_permission("activity.view"),
):
    items = get_entity_history(db, entity_type, entity_id, limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/user/{user_id}")
def user_activity(
    user_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = require_permission("activity.view"),
):
    items = get_user_activity(db, user_id, limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/stats")
def activity_stats(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = require_permission("activity.view"),
):
    return get_action_stats(db, days=days)
