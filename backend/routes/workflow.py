from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from database.connection import get_db
from models.user import User
from models.applicant import CandidateActivityLog
from middleware.role_auth import require_permission, get_user_permissions
from schemas.workflow import (
    ReceptionistForwardRequest,
    ReceptionistRejectRequest,
    HRReviewRequest,
    TechnicalEvaluationRequest,
    CEOReviewRequest,
    FinalDecisionRequest,
    InterviewRoundResponse,
    FinalDecisionResponse
)
from services.workflow_service import (
    receptionist_forward_candidate,
    receptionist_reject_candidate,
    hr_submit_candidate_review,
    submit_technical_round_evaluation,
    submit_ceo_round_evaluation,
    create_final_decision,
    list_interviewer_assignments,
    log_candidate_activity,
)
from services.applicant_service import get_applicant
from routes.applicant import serialize_candidate_for_user

router = APIRouter(
    prefix="/api/workflow",
    tags=["workflow"]
)


# ---------------------------------------------------------------------------
# GET /api/workflow/my-assignments — an interviewer's own queue
# ---------------------------------------------------------------------------

@router.get(
    "/my-assignments",
    summary="Rounds assigned to the current interviewer",
    description="Returns the interview rounds assigned to the logged-in "
                "interviewer. Gated by workflow.technical_evaluate — needs no "
                "candidate.list permission.",
)
def my_assignments_api(
    only_pending: bool = True,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    assignments = list_interviewer_assignments(
        db, current_user.email, only_pending
    )
    return {"success": True, "assignments": assignments}


# ---------------------------------------------------------------------------
# POST /api/workflow/receptionist/forward/{candidate_id}
# ---------------------------------------------------------------------------

@router.post(
    "/receptionist/forward/{candidate_id}",
    summary="Receptionist forward candidate to HR Review",
    description="Accessible by: RECEPTIONIST, SYSTEM_ADMIN"
)
def forward_candidate_api(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.reception_forward"),
):
    candidate = receptionist_forward_candidate(
        db=db,
        candidate_id=candidate_id,
        performed_by=current_user.email
    )
    return {
        "success": True,
        "message": "Candidate forwarded to HR successfully",
        "data": {
            "candidate_id": str(candidate.candidate_id),
            "status": candidate.status
        }
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/receptionist/reject/{candidate_id}
# ---------------------------------------------------------------------------

@router.post(
    "/receptionist/reject/{candidate_id}",
    summary="Receptionist reject candidate",
    description="Accessible by: RECEPTIONIST, SYSTEM_ADMIN. Rejects a candidate at the reception stage."
)
def reject_candidate_api(
    candidate_id: str,
    data: ReceptionistRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.reception_forward"),
):
    candidate = receptionist_reject_candidate(
        db=db,
        candidate_id=candidate_id,
        reason=data.reason,
        performed_by=current_user.email,
    )
    return {
        "success": True,
        "message": "Candidate rejected successfully",
        "data": {
            "candidate_id": str(candidate.candidate_id),
            "status": candidate.status
        }
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/hr/review/{candidate_id}
# ---------------------------------------------------------------------------

@router.post(
    "/hr/review/{candidate_id}",
    summary="Submit HR Review Form",
    description="Accessible by: HR_ADMIN, HR_PANEL, SYSTEM_ADMIN"
)
def submit_hr_review_api(
    candidate_id: str,
    data: HRReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.hr_review"),
):
    candidate = hr_submit_candidate_review(
        db=db,
        candidate_id=candidate_id,
        domain=data.domain,
        experience_bracket=data.experience_bracket,
        number_of_tech_rounds=data.number_of_tech_rounds,
        hr_status=data.hr_status,
        first_interviewer_email=data.first_interviewer_email,
        evaluation_data=data.evaluation_data,
        performed_by=current_user.email
    )
    
    return {
        "success": True,
        "message": "HR Review submitted successfully, Round 1 created.",
        "data": {
            "candidate_id": str(candidate.candidate_id),
            "status": candidate.status,
            "domain": candidate.domain,
            "total_rounds": candidate.total_rounds
        }
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/technical/evaluate/{candidate_id}/{round_number}
# ---------------------------------------------------------------------------

@router.post(
    "/technical/evaluate/{candidate_id}/{round_number}",
    response_model=dict,
    summary="Submit Technical Interviewer Evaluation",
    description="Accessible by: L1_PANEL, L2_PANEL, TECH_HEAD, SYSTEM_ADMIN. Must be the assigned interviewer."
)
def evaluate_technical_round_api(
    candidate_id: str,
    round_number: int,
    data: TechnicalEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    round_record = submit_technical_round_evaluation(
        db=db,
        candidate_id=candidate_id,
        round_number=round_number,
        status_selection=data.status_selection,
        remarks=data.remarks,
        evaluation_data=data.evaluation_data,
        next_interviewer_email=data.next_interviewer_email,
        performed_by=current_user.email,
        # "Evaluate any round regardless of assignment" is itself a permission,
        # not a role name — anyone who can see everything can stand in.
        is_admin="evaluation.view_all" in get_user_permissions(current_user),
    )
    
    return {
        "success": True,
        "message": f"Technical round {round_number} evaluation submitted successfully",
        "data": InterviewRoundResponse.model_validate(round_record).model_dump()
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/ceo/evaluate/{candidate_id}
# ---------------------------------------------------------------------------

@router.post(
    "/ceo/evaluate/{candidate_id}",
    summary="CEO/System Admin Review Round",
    description="Accessible by: SYSTEM_ADMIN"
)
def evaluate_ceo_round_api(
    candidate_id: str,
    data: CEOReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.ceo_evaluate"),
):
    round_record = submit_ceo_round_evaluation(
        db=db,
        candidate_id=candidate_id,
        remarks=data.remarks,
        evaluation_data=data.evaluation_data,
        save_draft=data.save_draft,
        performed_by=current_user.email
    )
    
    msg = "CEO evaluation draft saved successfully" if data.save_draft else "CEO evaluation submitted successfully"
    return {
        "success": True,
        "message": msg,
        "data": InterviewRoundResponse.model_validate(round_record).model_dump()
    }


# ---------------------------------------------------------------------------
# GET /api/workflow/final-discussion/{candidate_id}
# ---------------------------------------------------------------------------

@router.get(
    "/final-discussion/{candidate_id}",
    summary="Get details for Final Discussion Stage",
    description="Accessible by: SYSTEM_ADMIN, HR_ADMIN, or any role with decision.final permission"
)
def get_final_discussion_details_api(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("decision.final"),
):
    candidate = get_applicant(db, candidate_id)
    candidate_data = serialize_candidate_for_user(candidate, current_user)
    
    # Log: "Final Discussion Started" if not already logged
    has_started_log = db.query(CandidateActivityLog).filter(
        CandidateActivityLog.candidate_id == candidate.candidate_id,
        CandidateActivityLog.action == "Final Discussion Started"
    ).first()
    
    if not has_started_log:
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="Final Discussion Started",
            performed_by=current_user.email,
            details="Final discussion stage initiated"
        )
        db.refresh(candidate)
        candidate_data = serialize_candidate_for_user(candidate, current_user)

    # Separate technical and CEO rounds for convenience
    rounds = candidate_data.get("interview_rounds", []) or []
    technical_rounds = [r for r in rounds if r.get("round_type") == "TECHNICAL"]
    ceo_rounds = [r for r in rounds if r.get("round_type") == "CEO_ROUND"]
    
    return {
        "success": True,
        "candidate": candidate_data,
        "technical_scores": technical_rounds,
        "ceo_scores": ceo_rounds,
        "previous_evaluations": rounds
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/final-decision/{candidate_id}
# ---------------------------------------------------------------------------

@router.post(
    "/final-decision/{candidate_id}",
    summary="Submit Final Decision Details",
    description="Accessible by: SYSTEM_ADMIN, HR_ADMIN"
)
def submit_final_decision_api(
    candidate_id: str,
    data: FinalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("decision.final"),
):
    perms = get_user_permissions(current_user)
    decision = create_final_decision(
        db=db,
        candidate_id=candidate_id,
        final_status=data.final_status,
        offered_ctc=data.offered_ctc,
        joining_date=data.joining_date,
        final_remarks=data.final_remarks,
        hr_discussion_notes=data.hr_discussion_notes,
        hr_discussion=data.hr_discussion,
        ceo_discussion=data.ceo_discussion,
        approved_by=data.approved_by,
        save_draft=data.save_draft,
        performed_by=current_user.email,
        is_admin="evaluation.view_all" in perms
    )
    
    return {
        "success": True,
        "message": "Final decision draft saved successfully" if data.save_draft else "Final decision recorded successfully",
        "data": FinalDecisionResponse.model_validate(decision).model_dump()
    }
