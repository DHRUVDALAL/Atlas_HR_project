from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from models.communications import ActivityLog


def log_activity(
    db: Session,
    action: str,
    user_id: Optional[UUID] = None,
    user_email: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    entity_label: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_label=entity_label,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    db.flush()
    return entry


def get_activity_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
) -> tuple[List[ActivityLog], int]:
    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)
    if search:
        query = query.filter(
            ActivityLog.entity_label.ilike(f"%{search}%")
            | ActivityLog.user_email.ilike(f"%{search}%")
        )
    total = query.count()
    items = (
        query.order_by(desc(ActivityLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def get_entity_history(
    db: Session,
    entity_type: str,
    entity_id: str,
    limit: int = 100,
) -> List[ActivityLog]:
    return (
        db.query(ActivityLog)
        .filter(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id,
        )
        .order_by(desc(ActivityLog.created_at))
        .limit(limit)
        .all()
    )


def get_user_activity(
    db: Session,
    user_id: UUID,
    limit: int = 100,
) -> List[ActivityLog]:
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(desc(ActivityLog.created_at))
        .limit(limit)
        .all()
    )


def get_action_stats(db: Session, days: int = 30) -> Dict[str, int]:
    from sqlalchemy import func
    cutoff = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    results = (
        db.query(ActivityLog.action, func.count(ActivityLog.id))
        .filter(ActivityLog.created_at >= cutoff)
        .group_by(ActivityLog.action)
        .all()
    )
    return {action: count for action, count in results}
