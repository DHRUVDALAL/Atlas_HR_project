from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.communications import Notification


def create_notification(
    db: Session,
    user_id: UUID,
    title: str,
    message: str,
    type: str = "info",
    category: str = "system",
    priority: str = "normal",
    action_url: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        category=category,
        priority=priority,
        action_url=action_url,
        meta=meta,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_bulk_notifications(
    db: Session,
    user_ids: List[UUID],
    title: str,
    message: str,
    type: str = "info",
    category: str = "system",
    priority: str = "normal",
    action_url: Optional[str] = None,
) -> int:
    notifications = [
        Notification(
            user_id=uid,
            title=title,
            message=message,
            type=type,
            category=category,
            priority=priority,
            action_url=action_url,
        )
        for uid in user_ids
    ]
    db.add_all(notifications)
    db.commit()
    return len(notifications)


def get_user_notifications(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
) -> tuple[List[Notification], int]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if category:
        query = query.filter(Notification.category == category)
    if type:
        query = query.filter(Notification.type == type)
    total = query.count()
    items = (
        query.order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def get_unread_count(db: Session, user_id: UUID) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )


def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Notification:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, user_id: UUID) -> int:
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .update({"is_read": True, "read_at": datetime.now(timezone.utc)})
    )
    db.commit()
    return count


def delete_notification(db: Session, notification_id: UUID, user_id: UUID) -> bool:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        return False
    db.delete(notification)
    db.commit()
    return True
