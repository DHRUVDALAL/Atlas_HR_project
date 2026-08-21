from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.communications import SavedSearch


def save_search(
    db: Session,
    user_id: UUID,
    name: str,
    search_type: str,
    filters: Dict[str, Any],
    is_public: bool = False,
) -> SavedSearch:
    search = SavedSearch(
        user_id=user_id,
        name=name,
        search_type=search_type,
        filters=filters,
        is_public=is_public,
    )
    db.add(search)
    db.commit()
    db.refresh(search)
    return search


def get_saved_searches(
    db: Session,
    user_id: UUID,
) -> List[SavedSearch]:
    return (
        db.query(SavedSearch)
        .filter(
            (SavedSearch.user_id == user_id) | (SavedSearch.is_public == True)
        )
        .order_by(SavedSearch.use_count.desc())
        .all()
    )


def delete_saved_search(
    db: Session,
    search_id: str,
    user_id: UUID,
) -> bool:
    search = (
        db.query(SavedSearch)
        .filter(SavedSearch.id == search_id, SavedSearch.user_id == user_id)
        .first()
    )
    if not search:
        return False
    db.delete(search)
    db.commit()
    return True


def increment_use_count(db: Session, search_id: str) -> None:
    search = db.query(SavedSearch).filter(SavedSearch.id == search_id).first()
    if search:
        search.use_count = (search.use_count or 0) + 1
        db.commit()
