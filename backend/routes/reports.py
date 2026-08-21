import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from models.applicant import Applicant
from models.offer_onboarding import Offer, Onboarding

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/candidates/export")
def export_candidates(
    format: str = Query("csv", regex="^(csv|excel)$"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("report.export"),
):
    query = db.query(Applicant)
    if status:
        query = query.filter(Applicant.status == status)
    applicants = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application Number", "First Name", "Last Name", "Email", "Phone",
        "Position", "Status", "Experience", "Applied Date",
    ])
    for a in applicants:
        exp = ""
        if a.professional_details:
            exp = a.professional_details.total_experience or ""
        writer.writerow([
            a.application_number, a.first_name, a.last_name, a.email,
            a.phone, a.position_applied_for or "", a.status, exp,
            a.created_at.strftime("%Y-%m-%d") if a.created_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates.csv"},
    )


@router.get("/offers/export")
def export_offers(
    format: str = Query("csv", regex="^(csv|excel)$"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("report.export"),
):
    query = db.query(Offer)
    if status:
        query = query.filter(Offer.status == status)
    offers = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Offer ID", "Candidate ID", "CTC", "Status",
        "Offer Date", "Joining Date",
    ])
    for o in offers:
        writer.writerow([
            str(o.offer_id), str(o.candidate_id), o.offered_ctc,
            o.status,
            o.created_at.strftime("%Y-%m-%d") if o.created_at else "",
            o.joining_date.strftime("%Y-%m-%d") if o.joining_date else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=offers.csv"},
    )


@router.get("/onboarding/export")
def export_onboarding(
    format: str = Query("csv", regex="^(csv|excel)$"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("report.export"),
):
    query = db.query(Onboarding)
    if status:
        query = query.filter(Onboarding.status == status)
    items = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Onboarding ID", "Candidate ID", "Status",
        "Started", "Completed", "Created Date",
    ])
    for ob in items:
        writer.writerow([
            str(ob.onboarding_id), str(ob.candidate_id),
            ob.status,
            ob.started_at.strftime("%Y-%m-%d") if ob.started_at else "",
            ob.completed_at.strftime("%Y-%m-%d") if ob.completed_at else "",
            ob.created_at.strftime("%Y-%m-%d") if ob.created_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=onboarding.csv"},
    )


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = require_permission("dashboard.view"),
):
    from sqlalchemy import func

    total_candidates = db.query(Applicant).count()
    total_offers = db.query(Offer).count()
    total_onboarding = db.query(Onboarding).count()
    pending_offers = db.query(Offer).filter(Offer.status == "DRAFT").count()
    active_onboarding = db.query(Onboarding).filter(Onboarding.status.in_(["PENDING", "IN_PROGRESS"])).count()

    return {
        "total_candidates": total_candidates,
        "total_offers": total_offers,
        "total_onboarding": total_onboarding,
        "pending_offers": pending_offers,
        "active_onboarding": active_onboarding,
    }
