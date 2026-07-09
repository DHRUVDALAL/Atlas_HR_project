import os
import uuid
from datetime import date, datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.applicant import (
    Applicant,
    CandidateActivityLog,
    InterviewRound,
    FinalDecision,
    CandidateAssignment,
)
from services.applicant_service import _get_applicant_or_404

# The CEO/final-approver account the last round is routed to.
CEO_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@atlas.com")

# Outcome vocabularies (kept explicit — the DB stores plain strings).
HR_OUTCOMES = {"SELECT", "REJECT", "HOLD"}
ROUND_OUTCOMES = {"COMPLETED", "REJECTED", "HOLD"}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _lock_candidate(db: Session, candidate_id: uuid.UUID) -> None:
    """Take a row lock on the candidate to serialize concurrent workflow
    transitions (prevents double-submit races creating duplicate rounds)."""
    db.query(Applicant).filter(
        Applicant.candidate_id == candidate_id
    ).with_for_update().first()


def log_candidate_activity(
    db: Session,
    candidate_id: uuid.UUID,
    action: str,
    performed_by: str,
    details: Optional[str] = None
) -> CandidateActivityLog:
    """Log an activity audit trail for a candidate."""
    log = CandidateActivityLog(
        log_id=uuid.uuid4(),
        candidate_id=candidate_id,
        action=action,
        performed_by=performed_by,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def receptionist_forward_candidate(
    db: Session,
    candidate_id: str,
    performed_by: str
) -> Applicant:
    """
    Forward a candidate from Receptionist to HR Review.
    Changes candidate status from SUBMITTED/DRAFT to RECEPTION_FORWARDED.
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    
    # Receptionist can forward candidates who are in DRAFT, SUBMITTED or Submitted — awaiting reception
    if candidate.status not in ("DRAFT", "SUBMITTED", "Submitted — awaiting reception"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot forward candidate with status '{candidate.status}'. Only DRAFT, SUBMITTED, or Submitted — awaiting reception can be forwarded."
        )
        
    candidate.status = "RECEPTION_FORWARDED"
    db.commit()
    db.refresh(candidate)
    
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Reception Forwarded Form",
        performed_by=performed_by,
        details="Forwarded to HR review stage"
    )
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Candidate Status Changed",
        performed_by=performed_by,
        details="Status changed to RECEPTION_FORWARDED"
    )
    return candidate


def hr_submit_candidate_review(
    db: Session,
    candidate_id: str,
    domain: str,
    number_of_tech_rounds: int,
    hr_status: str,  # SELECT, REJECT, HOLD
    first_interviewer_email: str,
    evaluation_data: Dict[str, Any],
    performed_by: str
) -> Applicant:
    """Submit the HR Review Form.

    Only an HR outcome of SELECT advances the candidate into the technical
    pipeline (Round 1). REJECT / HOLD record the HR decision and STOP the
    candidate — no technical round or assignment is created.
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    if candidate.status != "RECEPTION_FORWARDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate must be in RECEPTION_FORWARDED status to submit HR review."
        )

    hr_status = (hr_status or "").upper()
    if hr_status not in HR_OUTCOMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid HR status. Must be one of {sorted(HR_OUTCOMES)}."
        )

    if number_of_tech_rounds < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of technical rounds must be at least 1."
        )

    candidate.domain = domain

    # Record the HR round itself (round 0) in every case.
    hr_round = InterviewRound(
        candidate_id=candidate.candidate_id,
        round_number=0,
        round_type="HR_REVIEW",
        assigned_interviewer=performed_by,
        status="COMPLETED",
        remarks=f"HR review completed. Status: {hr_status}",
        evaluation_data=evaluation_data,
    )
    db.add(hr_round)

    # Deactivate existing assignments.
    db.query(CandidateAssignment).filter(
        CandidateAssignment.candidate_id == candidate.candidate_id,
        CandidateAssignment.status == "ACTIVE"
    ).update({"status": "OVERRIDDEN"})

    if hr_status != "SELECT":
        # Rejected / held at HR — do NOT advance into technical rounds.
        candidate.status = "REJECTED" if hr_status == "REJECT" else "ON_HOLD"
        db.commit()
        db.refresh(candidate)
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="HR Submitted Review",
            performed_by=performed_by,
            details=f"HR outcome {hr_status}; candidate stopped at HR stage.",
        )
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="Candidate Status Changed",
            performed_by=performed_by,
            details=f"Status changed to {candidate.status}",
        )
        return candidate

    # SELECT — advance to technical Round 1.
    candidate.total_rounds = number_of_tech_rounds
    candidate.status = "TECH_ROUND_1"

    round1 = InterviewRound(
        candidate_id=candidate.candidate_id,
        round_number=1,
        round_type="TECHNICAL",
        assigned_interviewer=first_interviewer_email,
        status="PENDING",
        remarks=f"Domain: {domain}",
    )
    db.add(round1)

    assignment = CandidateAssignment(
        candidate_id=candidate.candidate_id,
        assigned_to=first_interviewer_email,
        assigned_by=performed_by,
        status="ACTIVE",
    )
    db.add(assignment)

    db.commit()
    db.refresh(candidate)

    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="HR Submitted Review",
        performed_by=performed_by,
        details=f"Domain: {domain}, Status: SELECT, Rounds configured: {number_of_tech_rounds}"
    )
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Candidate Status Changed",
        performed_by=performed_by,
        details=f"Status changed to TECH_ROUND_1. Assigned to {first_interviewer_email}"
    )
    return candidate


def submit_technical_round_evaluation(
    db: Session,
    candidate_id: str,
    round_number: int,
    status_selection: str,  # COMPLETED, REJECTED, HOLD
    remarks: str,
    evaluation_data: Dict[str, Any],
    next_interviewer_email: Optional[str],
    performed_by: str,
    is_admin: bool = False,
) -> InterviewRound:
    """Submit an evaluation for a technical interview round.

    Only a COMPLETED outcome advances the candidate (to the next technical
    round, or to the CEO round when the configured rounds are exhausted).
    A REJECTED / HOLD outcome stops the candidate — no further round is created.
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    status_selection = (status_selection or "").upper()
    if status_selection not in ROUND_OUTCOMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid outcome. Must be one of {sorted(ROUND_OUTCOMES)}."
        )

    # Lock the round row so two concurrent submissions can't both proceed.
    current_round = db.query(InterviewRound).filter(
        InterviewRound.candidate_id == candidate.candidate_id,
        InterviewRound.round_number == round_number,
        InterviewRound.round_type == "TECHNICAL"
    ).with_for_update().first()

    if not current_round:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Technical round {round_number} not found for this candidate."
        )

    if current_round.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Technical round {round_number} is already evaluated (status: {current_round.status})."
        )

    # Only the assigned interviewer (or a SYSTEM_ADMIN) may evaluate.
    if not is_admin and performed_by != current_round.assigned_interviewer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to evaluate this interview round."
        )

    if candidate.total_rounds is None or candidate.total_rounds < 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Candidate has no configured technical rounds; HR review is incomplete."
        )

    # Update current round
    current_round.status = status_selection
    current_round.remarks = remarks
    current_round.evaluation_data = evaluation_data
    current_round.next_interviewer_email = next_interviewer_email
    current_round.updated_at = _now_utc()

    # Deactivate active assignments
    db.query(CandidateAssignment).filter(
        CandidateAssignment.candidate_id == candidate.candidate_id,
        CandidateAssignment.status == "ACTIVE"
    ).update({"status": "COMPLETED"})

    # A negative interview outcome stops the candidate here.
    if status_selection in ("REJECTED", "HOLD"):
        candidate.status = "REJECTED" if status_selection == "REJECTED" else "ON_HOLD"
        db.commit()
        db.refresh(current_round)
        db.refresh(candidate)
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="Technical Round Submitted",
            performed_by=performed_by,
            details=f"Round {round_number} outcome {status_selection}; candidate stopped.",
        )
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="Candidate Status Changed",
            performed_by=performed_by,
            details=f"Status changed to {candidate.status}",
        )
        return current_round

    total_configured_rounds = candidate.total_rounds

    if round_number < total_configured_rounds:
        # Move to next technical round
        if not next_interviewer_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Next interviewer email is required for forwarding to the next technical round."
            )
            
        next_round_number = round_number + 1
        next_round = InterviewRound(
            round_id=uuid.uuid4(),
            candidate_id=candidate.candidate_id,
            round_number=next_round_number,
            round_type="TECHNICAL",
            assigned_interviewer=next_interviewer_email,
            status="PENDING",
            remarks=f"Forwarded from Round {round_number}"
        )
        db.add(next_round)
        
        # Update candidate status
        candidate.status = f"TECH_ROUND_{next_round_number}"
        
        # Assign next interviewer
        next_assignment = CandidateAssignment(
            assignment_id=uuid.uuid4(),
            candidate_id=candidate.candidate_id,
            assigned_to=next_interviewer_email,
            assigned_by=performed_by,
            status="ACTIVE"
        )
        db.add(next_assignment)
        
        log_detail = f"Round {round_number} completed. Forwarded to Round {next_round_number} (Interviewer: {next_interviewer_email})."
        
    else:
        # N rounds complete. Move to CEO / System Admin Round.
        ceo_interviewer = CEO_EMAIL

        ceo_round = InterviewRound(
            candidate_id=candidate.candidate_id,
            round_number=round_number + 1,
            round_type="CEO_ROUND",
            assigned_interviewer=ceo_interviewer,
            status="PENDING",
            remarks=f"Completed all {total_configured_rounds} technical rounds. Forwarded to CEO."
        )
        db.add(ceo_round)
        
        # Update candidate status
        candidate.status = "CEO_ROUND"
        
        # Assign to CEO
        ceo_assignment = CandidateAssignment(
            assignment_id=uuid.uuid4(),
            candidate_id=candidate.candidate_id,
            assigned_to=ceo_interviewer,
            assigned_by=performed_by,
            status="ACTIVE"
        )
        db.add(ceo_assignment)
        
        log_detail = f"Round {round_number} completed. All technical rounds complete. Forwarded to CEO."
        
    db.commit()
    db.refresh(current_round)
    db.refresh(candidate)
    
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Technical Round Submitted",
        performed_by=performed_by,
        details=f"Round {round_number} evaluation: {status_selection}. Remarks: {remarks}"
    )
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Candidate Status Changed",
        performed_by=performed_by,
        details=f"Status changed to {candidate.status}. {log_detail}"
    )
    
    return current_round


def submit_ceo_round_evaluation(
    db: Session,
    candidate_id: str,
    remarks: str,
    evaluation_data: Dict[str, Any],
    save_draft: bool,
    performed_by: str
) -> InterviewRound:
    """
    CEO/System Admin Review Round.
    - Can save decision for later (save_draft = True)
    - Or submit final decision (save_draft = False) which moves candidate to FINAL_DECISION status.
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    if candidate.status != "CEO_ROUND":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate must be in CEO_ROUND status for a CEO evaluation."
        )

    # Find CEO round (lock it so a completed one can't be reopened concurrently)
    ceo_round = db.query(InterviewRound).filter(
        InterviewRound.candidate_id == candidate.candidate_id,
        InterviewRound.round_type == "CEO_ROUND"
    ).order_by(InterviewRound.round_number.desc()).with_for_update().first()

    if not ceo_round:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CEO interview round record not found for this candidate."
        )

    if ceo_round.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CEO round is already completed and cannot be re-submitted."
        )

    # Update evaluation details
    ceo_round.remarks = remarks
    ceo_round.evaluation_data = evaluation_data
    ceo_round.updated_at = _now_utc()
    
    if save_draft:
        ceo_round.status = "UNDER_REVIEW"
        action_name = "CEO Saved Review Draft"
        log_detail = "Saved CEO evaluation draft for later."
    else:
        ceo_round.status = "COMPLETED"
        candidate.status = "FINAL_DECISION"
        
        # Deactivate assignment
        db.query(CandidateAssignment).filter(
            CandidateAssignment.candidate_id == candidate.candidate_id,
            CandidateAssignment.status == "ACTIVE"
        ).update({"status": "COMPLETED"})
        
        action_name = "CEO Submitted Review"
        log_detail = "CEO evaluation completed. Candidate forwarded to Final Decision."
        
    db.commit()
    db.refresh(ceo_round)
    db.refresh(candidate)
    
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action=action_name,
        performed_by=performed_by,
        details=log_detail
    )
    
    if not save_draft:
        log_candidate_activity(
            db=db,
            candidate_id=candidate.candidate_id,
            action="Candidate Status Changed",
            performed_by=performed_by,
            details="Status changed to FINAL_DECISION"
        )
        
    return ceo_round


def create_final_decision(
    db: Session,
    candidate_id: str,
    final_status: str,  # SELECTED, REJECTED, HOLD
    offered_ctc: Optional[float],
    joining_date: Optional[date],
    final_remarks: Optional[str],
    hr_discussion_notes: Optional[str],
    performed_by: str,
    user_role: Optional[str] = None
) -> FinalDecision:
    """
    Create or update final decision details.
    - Candidate must have reached FINAL_DECISION (i.e. the CEO round completed).
    - offered_ctc is required if final_status is SELECTED.
    - Updates candidate status to final_status (SELECTED, REJECTED, HOLD).
    """
    candidate = _get_applicant_or_404(db, candidate_id)
    _lock_candidate(db, candidate.candidate_id)

    # Gate: a final decision can only be recorded once the pipeline has run
    # through to the FINAL_DECISION stage — no skipping straight from DRAFT.
    is_sys_admin = (user_role == "SYSTEM_ADMIN")
    if not (is_sys_admin or candidate.status == "FINAL_DECISION"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A final decision can only be recorded when the candidate is "
                   "in FINAL_DECISION status (after the CEO round)."
        )

    # CTC validation
    if final_status == "SELECTED" and (offered_ctc is None or offered_ctc <= 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offered CTC is required and must be greater than 0 if status is SELECTED."
        )
        
    # Check if final decision already exists
    decision = db.query(FinalDecision).filter(
        FinalDecision.candidate_id == candidate.candidate_id
    ).first()
    
    if decision:
        decision.final_status = final_status
        decision.offered_ctc = offered_ctc
        decision.joining_date = joining_date
        decision.final_remarks = final_remarks
        decision.hr_discussion_notes = hr_discussion_notes
        decision.approved_by = performed_by
        decision.decision_date = _now_utc()
    else:
        decision = FinalDecision(
            decision_id=uuid.uuid4(),
            candidate_id=candidate.candidate_id,
            final_status=final_status,
            offered_ctc=offered_ctc,
            joining_date=joining_date,
            final_remarks=final_remarks,
            hr_discussion_notes=hr_discussion_notes,
            approved_by=performed_by,
            decision_date=_now_utc(),
        )
        db.add(decision)
        
    # Update candidate status
    candidate.status = final_status
    
    # Deactivate any active assignments
    db.query(CandidateAssignment).filter(
        CandidateAssignment.candidate_id == candidate.candidate_id,
        CandidateAssignment.status == "ACTIVE"
    ).update({"status": "COMPLETED"})
    
    db.commit()
    db.refresh(decision)
    db.refresh(candidate)
    
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Final Decision Created",
        performed_by=performed_by,
        details=f"Candidate {final_status}. CTC: {offered_ctc}, Date: {joining_date}"
    )
    log_candidate_activity(
        db=db,
        candidate_id=candidate.candidate_id,
        action="Candidate Status Changed",
        performed_by=performed_by,
        details=f"Status changed to {final_status}"
    )

    return decision


def list_interviewer_assignments(db: Session, email: str, only_pending: bool):
    """Return the interview rounds assigned to a given interviewer, joined with
    their candidate. This is what powers an interviewer's dashboard queue — it
    needs only the interviewer's own permission, not candidate.list."""
    q = (
        db.query(InterviewRound)
        .join(Applicant, Applicant.candidate_id == InterviewRound.candidate_id)
        .filter(InterviewRound.assigned_interviewer == email)
    )
    if only_pending:
        q = q.filter(InterviewRound.status == "PENDING")
    q = q.order_by(InterviewRound.created_at.desc())

    rows = []
    for r in q.all():
        c = r.candidate
        rows.append({
            "candidate_id": str(c.candidate_id),
            "application_number": c.application_number,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "domain": c.domain,
            "candidate_status": c.status,
            "round_id": str(r.round_id),
            "round_number": r.round_number,
            "round_type": r.round_type,
            "round_status": r.status,
        })
    return rows
