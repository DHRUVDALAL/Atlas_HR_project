from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission, get_user_permissions
from services.notification_service import (
    create_notification,
    create_bulk_notifications,
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    delete_notification,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_read: Optional[bool] = Query(None),
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("notification.view"),
):
    items, total = get_user_notifications(
        db, user_id=current_user.user_id, skip=skip, limit=limit,
        is_read=is_read, category=category, type=type,
    )
    return {
        "items": items,
        "total": total,
        "unread_count": get_unread_count(db, current_user.user_id),
        "skip": skip,
        "limit": limit,
    }


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = require_permission("notification.view"),
):
    return {"count": get_unread_count(db, current_user.user_id)}


@router.put("/{notification_id}/read")
def read_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("notification.view"),
):
    return mark_as_read(db, notification_id, current_user.user_id)


@router.put("/read-all")
def read_all(
    db: Session = Depends(get_db),
    current_user: User = require_permission("notification.view"),
):
    count = mark_all_as_read(db, current_user.user_id)
    return {"marked_read": count}


@router.delete("/{notification_id}")
def remove_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("notification.view"),
):
    deleted = delete_notification(db, notification_id, current_user.user_id)
    return {"deleted": deleted}
