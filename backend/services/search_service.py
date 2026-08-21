from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.applicant import Applicant
from models.user import User
from models.offer_onboarding import Offer, Onboarding


def global_search(
    db: Session,
    query: str,
    search_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Dict[str, Any]:
    results = []
    search_pattern = f"%{query}%"

    if search_type is None or search_type == "candidates":
        candidates = (
            db.query(Applicant)
            .filter(
                or_(
                    Applicant.first_name.ilike(search_pattern),
                    Applicant.last_name.ilike(search_pattern),
                    Applicant.email.ilike(search_pattern),
                    Applicant.phone.ilike(search_pattern),
                    Applicant.application_number.ilike(search_pattern),
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        for c in candidates:
            results.append({
                "type": "candidate",
                "id": str(c.candidate_id),
                "title": f"{c.first_name} {c.last_name}",
                "subtitle": f"{c.email} | {c.application_number}",
                "status": c.status,
            })

    if search_type is None or search_type == "users":
        users = (
            db.query(User)
            .filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        for u in users:
            full_name = f"{u.first_name} {u.last_name}"
            results.append({
                "type": "user",
                "id": str(u.user_id),
                "title": full_name,
                "subtitle": f"{u.email} | {u.role.role_name if u.role else 'No Role'}",
                "status": "active" if u.is_active else "inactive",
            })

    if search_type is None or search_type == "offers":
        offers = (
            db.query(Offer)
            .join(Applicant, Offer.candidate_id == Applicant.candidate_id)
            .filter(
                or_(
                    Applicant.first_name.ilike(search_pattern),
                    Applicant.last_name.ilike(search_pattern),
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        for o in offers:
            results.append({
                "type": "offer",
                "id": str(o.offer_id),
                "title": f"Offer - {o.candidate.first_name} {o.candidate.last_name}" if o.candidate else "Offer",
                "subtitle": f"Status: {o.status}",
                "status": o.status,
            })

    if search_type is None or search_type == "onboarding":
        onboardings = (
            db.query(Onboarding)
            .join(Applicant, Onboarding.candidate_id == Applicant.candidate_id)
            .filter(
                or_(
                    Applicant.first_name.ilike(search_pattern),
                    Applicant.last_name.ilike(search_pattern),
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        for ob in onboardings:
            results.append({
                "type": "onboarding",
                "id": str(ob.onboarding_id),
                "title": f"Onboarding - {ob.candidate.first_name} {ob.candidate.last_name}" if ob.candidate else "Onboarding",
                "subtitle": f"Status: {ob.status}",
                "status": ob.status,
            })

    return {
        "items": results[:limit],
        "total": len(results),
        "query": query,
        "search_type": search_type,
    }
