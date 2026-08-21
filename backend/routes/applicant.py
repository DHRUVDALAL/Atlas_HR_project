"""
Applicant & Candidate Intake Module — API Routes

The candidate registration form is filled entirely in the browser (candidates
have no account). Only on final submit is ONE record written — there is no
server-side draft.

End-points:
  POST   /api/applicant                     — Submit a complete application
                                              (multipart: JSON payload + PDF)
  GET    /api/applicants                     — List candidates (staff)
  GET    /api/applicant/{id}                 — Get one candidate (staff)
  PUT    /api/applicant/{id}                 — Edit a candidate (staff)
  DELETE /api/applicant/{id}                 — Delete a candidate (staff)
"""

from fastapi import (
    APIRouter, Depends, UploadFile, File, Form, Query, Request,
    HTTPException, status, BackgroundTasks,
)
from pydantic import ValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from database.connection import get_db
from models.user import User
from models.applicant import Applicant
from schemas.applicant import (
    ApplicantFullCreate,
    ApplicantUpdate,
)
from services.applicant_service import (
    create_submitted_applicant,
    get_applicant,
    update_applicant,
    list_candidates_advanced,
    delete_candidate,
)
from services.workflow_service import log_candidate_activity
from middleware.role_auth import require_permission, get_user_permissions
from utils.limiter import limiter


router = APIRouter(
    tags=["applicants"],
)

# The single submit endpoint below is public (walk-in candidates have no
# account). Every other endpoint is gated by permission codes, never role names.


def serialize_candidate_for_user(candidate: Applicant, user: Optional[User]) -> Dict[str, Any]:
    # Base dictionary containing Sections 1-8 + Documents (which are public / form details)
    data = {
        "applicant_id": str(candidate.candidate_id),
        "candidate_id": str(candidate.candidate_id),
        "application_number": candidate.application_number,
        "first_name": candidate.first_name,
        "middle_name": candidate.middle_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "alternate_phone": candidate.alternate_phone,
        "gender": candidate.gender,
        "date_of_birth": candidate.date_of_birth.isoformat() if candidate.date_of_birth else None,
        "current_address": candidate.current_address,
        "permanent_address": candidate.permanent_address,
        "city": candidate.city,
        "state": candidate.state,
        "country": candidate.country,
        "pincode": candidate.pincode,
        "status": candidate.status,
        "domain": candidate.domain,
        "total_rounds": candidate.total_rounds,
        "position_applied_for": candidate.position_applied_for,
        "referred_by": candidate.referred_by,
        "reference_number": candidate.reference_number,
        "applied_from": candidate.applied_from,
        "source_name": candidate.source_name,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        "updated_at": candidate.updated_at.isoformat() if candidate.updated_at else None,
        
        # Section 2 - Professional details
        "professional_details": {
            "current_company": candidate.professional_details.current_company,
            "current_designation": candidate.professional_details.current_designation,
            "total_experience": candidate.professional_details.total_experience,
            "relevant_experience": candidate.professional_details.relevant_experience,
            "current_ctc": candidate.professional_details.current_ctc,
            "expected_ctc": candidate.professional_details.expected_ctc,
            "notice_period": candidate.professional_details.notice_period,
            "joining_availability": candidate.professional_details.joining_availability,
            "preferred_location": candidate.professional_details.preferred_location,
            "employment_type": candidate.professional_details.employment_type,
        } if candidate.professional_details else None,
        
        # Section 3 - Employment history
        "employment_history": [
            {
                "company_name": eh.company_name,
                "designation": eh.designation,
                "start_date": eh.start_date.isoformat() if eh.start_date else None,
                "end_date": eh.end_date.isoformat() if eh.end_date else None,
                "responsibilities": eh.responsibilities,
                "reason_for_leaving": eh.reason_for_leaving,
            } for eh in candidate.employment_history
        ],
        
        # Section 4 - Education
        "education": [
            {
                "qualification": edu.qualification,
                "institution_name": edu.institution_name,
                "university": edu.university,
                "passing_year": edu.passing_year,
                "percentage": edu.percentage,
                "grade": edu.grade,
                "specialization": edu.specialization,
            } for edu in candidate.education
        ],
        
        # Section 5 - Personality rating
        "personality_assessment": [
            {
                "question_number": pa.question_number,
                "rating": pa.rating
            } for pa in candidate.personality_assessment
        ],
        
        # Section 6 - Situational responses
        "situational_responses": [
            {
                "question_number": sr.question_number,
                "selected_option": sr.selected_option
            } for sr in candidate.situational_responses
        ],
        
        # Section 7 - Written responses
        "written_responses": [
            {
                "question_number": wr.question_number,
                "answer_text": wr.answer_text
            } for wr in candidate.written_responses
        ],
        
        # Section 8 - Declaration
        "declaration": {
            "declaration_accepted": candidate.declaration.declaration_accepted,
            "consent_accepted": candidate.declaration.consent_accepted,
            "signed_date": candidate.declaration.signed_date.isoformat() if candidate.declaration.signed_date else None,
        } if candidate.declaration else None,
        
        # Signature Documents — never expose the server-side absolute path.
        "documents": [
            {
                "document_id": str(doc.document_id),
                "document_type": doc.document_type,
                "file_name": doc.file_name,
                "file_path": doc.file_path,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            } for doc in candidate.documents
        ]
    }
    
    # Anonymous (public/test client) — Sections 1-8 only, no internal data.
    if not user:
        return data

    perms = get_user_permissions(user)
    email = user.email

    def _round(r):
        return {
            "round_id": str(r.round_id),
            "round_number": r.round_number,
            "round_type": r.round_type,
            "assigned_interviewer": r.assigned_interviewer,
            "next_interviewer_email": r.next_interviewer_email,
            "status": r.status,
            "remarks": r.remarks,
            "evaluation_data": r.evaluation_data,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }

    def _log(lg):
        return {
            "log_id": str(lg.log_id),
            "action": lg.action,
            "performed_by": lg.performed_by,
            "details": lg.details,
            "timestamp": lg.timestamp.isoformat() if lg.timestamp else None,
        }

    def _decision(d, include_notes):
        out = {
            "decision_id": str(d.decision_id),
            "final_status": d.final_status,
            "offered_ctc": d.offered_ctc,
            "joining_date": d.joining_date.isoformat() if d.joining_date else None,
            "approved_by": d.approved_by,
            "final_remarks": d.final_remarks,
            "decision_date": d.decision_date.isoformat() if d.decision_date else None,
        }
        if include_notes:
            out["hr_discussion_notes"] = d.hr_discussion_notes
        return out

    fd = candidate.final_decision

    # Visibility is driven by the viewer's evaluation.view_* permission, not by
    # role name — so any role mapped to a scope gets that scope automatically.
    if "evaluation.view_all" in perms:
        # Full visibility: every round, log and the decision (with HR notes).
        data["interview_rounds"] = [_round(r) for r in candidate.interview_rounds]
        data["activity_logs"] = [_log(lg) for lg in candidate.activity_logs]
        data["final_decision"] = _decision(fd, include_notes=True) if fd else None

    elif "evaluation.view_hr" in perms:
        # HR: HR rounds + logs; decision only when SELECTED, without HR notes.
        hr_rounds = [r for r in candidate.interview_rounds
                     if r.round_type == "HR_REVIEW"]
        data["interview_rounds"] = [_round(r) for r in hr_rounds]
        data["activity_logs"] = [_log(lg) for lg in candidate.activity_logs]
        if fd and fd.final_status == "SELECTED":
            data["final_decision"] = _decision(fd, include_notes=False)
        else:
            data["final_decision"] = None

    elif "evaluation.view_assigned" in perms:
        # Interviewer: only the rounds they are assigned to, plus activity logs.
        mine = [r for r in candidate.interview_rounds
                if r.assigned_interviewer == email]
        data["interview_rounds"] = [_round(r) for r in mine]
        data["final_decision"] = None
        data["activity_logs"] = [_log(lg) for lg in candidate.activity_logs]

    else:
        # Receptionist and other roles: show activity logs for context,
        # but no interview rounds or final decision (internal data).
        data["interview_rounds"] = []
        data["final_decision"] = None
        data["activity_logs"] = [_log(lg) for lg in candidate.activity_logs]

    return data


# ---------------------------------------------------------------------------
# POST /api/applicant — Submit a complete application (public, atomic)
# ---------------------------------------------------------------------------

from services.email_triggers import trigger_registration_email

@router.post(
    "/api/applicant",
    response_model=dict,
    status_code=201,
    summary="Submit a complete candidate application",
    description=(
        "Public endpoint. multipart/form-data with a `payload` field (JSON of "
        "all sections) and a `signature` PDF file. Creates ONE candidate record "
        "with status SUBMITTED in a single transaction — there is no draft."
    ),
)
@router.post("/api/applicants", response_model=dict, status_code=201,
             include_in_schema=False)
@limiter.limit("20/hour")
def submit_application_api(
    request: Request,
    payload: str = Form(..., description="JSON string of the full application"),
    signature: UploadFile = File(..., description="Signature PDF (max 5 MB)"),
    db: Session = Depends(get_db),
):
    try:
        data = ApplicantFullCreate.model_validate_json(payload)
    except ValidationError as exc:
        # jsonable_encoder flattens any ValueError objects in the error ctx
        # (raised by custom validators) so the 422 body is serializable.
        import logging
        logging.getLogger(__name__).error(f"Validation error in submit_application_api. Payload: {payload}")
        logging.getLogger(__name__).error(f"Errors: {exc.errors()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=jsonable_encoder(exc.errors()),
        )

    candidate = create_submitted_applicant(db, data, signature)

    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Application Submitted",
        performed_by=candidate.email,
        details="Candidate submitted the application form",
    )

    # Trigger registration confirmation email
    candidate_name = f"{candidate.first_name} {candidate.last_name}"
    try:
        trigger_registration_email(
            db=db,
            to_email=candidate.email,
            candidate_name=candidate_name,
            application_number=candidate.application_number,
            position=candidate.position_applied_for or "the position",
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to trigger registration email: {e}")

    return {
        "success": True,
        "message": "Application submitted successfully",
        "data": serialize_candidate_for_user(candidate, None),
    }


# ---------------------------------------------------------------------------
# GET /api/applicants — List Candidates (with filters, search, sort)
# ---------------------------------------------------------------------------

@router.get(
    "/api/applicants",
    response_model=dict,
    summary="List all applicants/candidates",
    description="Returns paginated list of applicants. Supports search, filtering, and sorting."
)
def list_candidates_api(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=500, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by candidate status (single)"),
    statuses: Optional[str] = Query(None, description="Filter by multiple candidate statuses (comma-separated)"),
    gender: Optional[str] = Query(None, description="Filter by gender (MALE, FEMALE, OTHER, OTHERS)"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    search: Optional[str] = Query(None, description="Search term matching name, email, phone, or application number"),
    sort_by: str = Query("created_at", description="Field to sort by (created_at or experience)"),
    sort_order: str = Query("desc", description="Sort order (asc or desc)"),
    db: Session = Depends(get_db),
    current_user: User = require_permission("candidate.list"),
):
    # Requires the candidate.list permission — the PII list is never public.
    total, candidates = list_candidates_advanced(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        statuses_filter=statuses,
        gender_filter=gender,
        city_filter=city,
        state_filter=state,
        domain_filter=domain,
        search_query=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "success": True,
        "total": total,
        "skip": skip,
        "limit": limit,
        "applicants": [
            {
                "applicant_id": str(c.candidate_id),
                "candidate_id": str(c.candidate_id),
                "application_number": c.application_number,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "email": c.email,
                "phone": c.phone,
                "status": c.status,
                "domain": c.domain,
                "position_applied_for": c.position_applied_for,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            } for c in candidates
        ]
    }


# ---------------------------------------------------------------------------
# GET /api/applicant/{id} & /api/applicants/{id} — Get Full Application
# ---------------------------------------------------------------------------

@router.get(
    "/api/applicant/{applicant_id}",
    response_model=dict,
    summary="Get candidate by ID",
    description="Returns the role-filtered candidate record details based on the user's role."
)
@router.get(
    "/api/applicants/{applicant_id}",
    response_model=dict,
    include_in_schema=False
)
def get_candidate_api(
    applicant_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("candidate.read"),
):
    candidate = get_applicant(db, applicant_id)
    perms = get_user_permissions(current_user)

    # An "assigned-only" viewer (interviewer scope) may read a candidate only if
    # they are actually assigned to one of its rounds. Broader scopes
    # (view_hr / view_all) skip this check.
    assigned_only = (
        "evaluation.view_assigned" in perms
        and "evaluation.view_hr" not in perms
        and "evaluation.view_all" not in perms
    )
    if assigned_only:
        from models.applicant import InterviewRound
        assigned_round = db.query(InterviewRound).filter(
            InterviewRound.candidate_id == candidate.candidate_id,
            InterviewRound.assigned_interviewer == current_user.email
        ).first()
        if not assigned_round:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not assigned to evaluate this candidate."
            )

    return {
        "success": True,
        "data": serialize_candidate_for_user(candidate, current_user),
    }


# ---------------------------------------------------------------------------
# PUT /api/applicant/{id} & /api/applicants/{id} — Update Draft Application
# ---------------------------------------------------------------------------

@router.put(
    "/api/applicant/{applicant_id}",
    response_model=dict,
    summary="Edit a candidate application (staff)",
    description="Staff-only. Requires candidate.update (pre-arrival) or "
                "candidate.update_any."
)
@router.put(
    "/api/applicants/{applicant_id}",
    response_model=dict,
    include_in_schema=False
)
def update_candidate_api(
    applicant_id: str,
    data: ApplicantUpdate,
    db: Session = Depends(get_db),
    current_user: User = require_permission("candidate.read"),
):
    perms = get_user_permissions(current_user)
    if not ({"candidate.update", "candidate.update_any"} & perms):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )
    candidate = update_applicant(
        db, applicant_id, data,
        can_edit_prearrival="candidate.update" in perms,
        can_edit_any="candidate.update_any" in perms,
    )

    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Candidate Updated",
        performed_by=current_user.email,
        details="Candidate record updated by staff",
    )

    return {
        "success": True,
        "message": "Application updated successfully",
        "data": serialize_candidate_for_user(candidate, current_user),
    }


# ---------------------------------------------------------------------------
# DELETE /api/applicant/{id} & /api/applicants/{id} — Delete candidate
# ---------------------------------------------------------------------------

@router.delete(
    "/api/applicant/{applicant_id}",
    response_model=dict,
    summary="Delete candidate application",
    description="Accessible by: SYSTEM_ADMIN"
)
@router.delete(
    "/api/applicants/{applicant_id}",
    response_model=dict,
    include_in_schema=False
)
def delete_candidate_api(
    applicant_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("candidate.delete"),
):
    delete_candidate(db, applicant_id)
    return {
        "success": True,
        "message": "Candidate application deleted successfully"
    }
