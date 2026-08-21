import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from models.offer_onboarding import Offer, Onboarding
from models.applicant import Applicant, InterviewRound
from services.email_service import process_email_queue, retry_failed_emails

logger = logging.getLogger(__name__)


def check_offer_expiry(db: Session, days_before: int = 3) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days_before)
    expiring = (
        db.query(Offer)
        .filter(
            Offer.status == "SENT",
            Offer.sent_at != None,
            Offer.sent_at <= cutoff,
        )
        .all()
    )
    results = []
    for offer in expiring:
        results.append({
            "type": "offer_expiry",
            "offer_id": str(offer.offer_id),
            "candidate_id": str(offer.candidate_id),
            "sent_at": offer.sent_at.isoformat() if offer.sent_at else None,
        })
    return results


def check_pending_documents(db: Session) -> List[Dict[str, Any]]:
    incomplete = (
        db.query(Onboarding)
        .filter(
            Onboarding.status.in_(["PENDING", "IN_PROGRESS"]),
        )
        .all()
    )
    results = []
    for onb in incomplete:
        results.append({
            "type": "pending_documents",
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
        })
    return results


def check_upcoming_interviews(db: Session, hours_ahead: int = 24) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=hours_ahead)
    upcoming = (
        db.query(InterviewRound)
        .filter(
            InterviewRound.created_at >= now,
            InterviewRound.created_at <= cutoff,
            InterviewRound.status.in_(["PENDING"]),
        )
        .all()
    )
    results = []
    for interview in upcoming:
        results.append({
            "type": "upcoming_interview",
            "interview_id": str(interview.round_id),
            "candidate_id": str(interview.candidate_id),
            "round": interview.round_type,
            "created_at": interview.created_at.isoformat() if interview.created_at else None,
        })
    return results


def check_pending_joinings(db: Session, days_ahead: int = 7) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days_ahead)
    pending = (
        db.query(Onboarding, Offer)
        .join(Offer, Onboarding.candidate_id == Offer.candidate_id)
        .filter(
            Onboarding.status.in_(["PENDING", "IN_PROGRESS"]),
            Offer.joining_date != None,
            Offer.joining_date <= cutoff,
        )
        .all()
    )
    results = []
    for onb, offer in pending:
        results.append({
            "type": "joining_today",
            "onboarding_id": str(onb.onboarding_id),
            "candidate_id": str(onb.candidate_id),
            "joining_date": offer.joining_date.isoformat() if offer.joining_date else None,
        })
    return results


def run_daily_reminders(db: Session) -> Dict[str, Any]:
    results = {
        "offer_expiry": check_offer_expiry(db),
        "pending_documents": check_pending_documents(db),
        "upcoming_interviews": check_upcoming_interviews(db),
        "pending_joinings": check_pending_joinings(db),
        "email_queue_processed": 0,
        "failed_emails_retried": 0,
    }

    queue_results = process_email_queue(db, limit=50)
    results["email_queue_processed"] = len(queue_results)

    retry_results = retry_failed_emails(db, limit=20)
    results["failed_emails_retried"] = len(retry_results)

    return results


def get_scheduler_status(db: Session) -> Dict[str, Any]:
    from models.email import EmailQueue, EmailHistory
    from sqlalchemy import func

    queued = db.query(EmailQueue).filter(EmailQueue.locked == False).count()
    locked = db.query(EmailQueue).filter(EmailQueue.locked == True).count()
    total_sent = db.query(EmailHistory).filter(EmailHistory.status == "sent").count()
    total_failed = db.query(EmailHistory).filter(EmailHistory.status == "failed").count()

    return {
        "queue_pending": queued,
        "queue_locked": locked,
        "total_sent": total_sent,
        "total_failed": total_failed,
        "last_run": datetime.now(timezone.utc).isoformat(),
    }
