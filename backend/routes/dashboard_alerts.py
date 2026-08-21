from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from models.applicant import Applicant, InterviewRound
from models.offer_onboarding import Offer, Onboarding

router = APIRouter(prefix="/api/dashboard-alerts", tags=["Dashboard Alerts"])


@router.get("")
def get_dashboard_alerts(
    db: Session = Depends(get_db),
    current_user: User = require_permission("dashboard.view"),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    pending_review = (
        db.query(Applicant)
        .filter(Applicant.status.in_(["Submitted — awaiting reception", "RECEPTION_FORWARDED", "DRAFT"]))
        .count()
    )

    interviews_today = (
        db.query(InterviewRound)
        .filter(
            InterviewRound.created_at >= today_start,
            InterviewRound.created_at < today_end,
            InterviewRound.status.in_(["PENDING"]),
        )
        .count()
    )

    interviews_this_week = (
        db.query(InterviewRound)
        .filter(
            InterviewRound.created_at >= today_start,
            InterviewRound.created_at < week_end,
            InterviewRound.status.in_(["PENDING"]),
        )
        .count()
    )

    offers_pending = (
        db.query(Offer)
        .filter(Offer.status.in_(["DRAFT", "SENT"]))
        .count()
    )

    offers_expiring_soon = (
        db.query(Offer)
        .filter(
            Offer.status == "SENT",
            Offer.sent_at != None,
            Offer.sent_at <= week_end,
            Offer.sent_at >= today_start,
        )
        .count()
    )

    joinings_today = (
        db.query(Onboarding)
        .join(Offer, Onboarding.candidate_id == Offer.candidate_id)
        .filter(
            Offer.joining_date >= today_start.date(),
            Offer.joining_date < today_end.date(),
            Onboarding.status.in_(["PENDING", "IN_PROGRESS"]),
        )
        .count()
    )

    joinings_this_week = (
        db.query(Onboarding)
        .join(Offer, Onboarding.candidate_id == Offer.candidate_id)
        .filter(
            Offer.joining_date >= today_start.date(),
            Offer.joining_date < week_end.date(),
            Onboarding.status.in_(["PENDING", "IN_PROGRESS"]),
        )
        .count()
    )

    pending_documents = (
        db.query(Onboarding)
        .filter(Onboarding.status.in_(["PENDING", "IN_PROGRESS"]))
        .count()
    )

    overdue_offers = (
        db.query(Offer)
        .filter(
            Offer.status == "SENT",
            Offer.sent_at != None,
            Offer.sent_at < today_start,
        )
        .count()
    )

    return {
        "pending_review": pending_review,
        "interviews_today": interviews_today,
        "interviews_this_week": interviews_this_week,
        "offers_pending": offers_pending,
        "offers_expiring_soon": offers_expiring_soon,
        "overdue_offers": overdue_offers,
        "joinings_today": joinings_today,
        "joinings_this_week": joinings_this_week,
        "pending_documents": pending_documents,
    }
