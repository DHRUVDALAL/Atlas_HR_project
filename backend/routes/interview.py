"""
Interview Engine API Routes.

All endpoints for the dynamic SAP Technical Interview Engine.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from schemas.interview import (
    InterviewAssignRequest,
    InterviewSaveRequest,
    InterviewSubmitRequest,
)
from services.interview_service import (
    list_domains,
    list_experience_brackets,
    get_questions_for_domain_experience,
    get_questions_grouped_by_category,
    create_assignment,
    get_assignment_for_candidate,
    save_progress,
    load_progress,
    submit_evaluation,
    get_result,
    get_summary,
)

router = APIRouter(
    prefix="/api/interview",
    tags=["interview-engine"],
)


# ── Reference data ──────────────────────────────────────────────

@router.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    return {"success": True, "domains": list_domains(db)}


@router.get("/experience-brackets")
def get_experience_brackets(db: Session = Depends(get_db)):
    return {"success": True, "brackets": list_experience_brackets(db)}


# ── Questions ───────────────────────────────────────────────────

@router.get("/questions")
def get_questions(
    domain: str,
    experience: str,
    grouped: bool = False,
    db: Session = Depends(get_db),
):
    if grouped:
        groups = get_questions_grouped_by_category(db, domain, experience)
        return {"success": True, "groups": groups, "total_groups": len(groups)}
    questions = get_questions_for_domain_experience(db, domain, experience)
    if not questions:
        return {
            "success": True,
            "questions": [],
            "message": "No interview questions are available for the selected Domain and Experience Bracket.",
        }
    return {"success": True, "questions": questions, "total": len(questions)}

@router.get("/questions/{candidate_id}")
def get_candidate_questions(
    candidate_id: str,
    grouped: bool = False,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    assignment = get_assignment_for_candidate(db, candidate_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="No assignment found for candidate")
    domain = assignment["domain_code"]
    experience = assignment["experience_bracket_code"]
    
    if grouped:
        groups = get_questions_grouped_by_category(db, domain, experience)
        return {"success": True, "groups": groups, "total_groups": len(groups)}
    questions = get_questions_for_domain_experience(db, domain, experience)
    return {"success": True, "questions": questions, "total": len(questions)}


# ── Assignment ──────────────────────────────────────────────────

@router.post("/assign")
def assign_candidate(
    data: InterviewAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.hr_review"),
):
    result = create_assignment(
        db=db,
        candidate_id=data.candidate_id,
        domain_code=data.domain_code,
        experience_bracket_code=data.experience_bracket_code,
        assigned_interviewer=data.assigned_interviewer,
        assigned_by=current_user.email,
        interview_round=data.interview_round,
    )
    return {"success": True, "assignment": result}


@router.get("/assignment/{candidate_id}")
def get_assignment(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    assignment = get_assignment_for_candidate(db, candidate_id)
    if not assignment:
        return {"success": True, "assignment": None}
    return {"success": True, "assignment": assignment}


# ── Auto-save ───────────────────────────────────────────────────

@router.post("/auto-save/{candidate_id}")
def auto_save(
    candidate_id: str,
    data: InterviewSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    assignment = get_assignment_for_candidate(db, candidate_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="No assignment found for this candidate.")
    result = save_progress(db, assignment["id"], data.responses)
    return {"success": True, **result}


@router.get("/auto-save/{candidate_id}")
def load_auto_save(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    assignment = get_assignment_for_candidate(db, candidate_id)
    if not assignment:
        return {"success": True, "responses": [], "is_submitted": False}
    result = load_progress(db, assignment["id"])
    return {"success": True, **result}


# ── Submit evaluation ───────────────────────────────────────────

from services.workflow_service import submit_technical_round_evaluation

@router.post("/submit/{candidate_id}")
def submit_interview(
    candidate_id: str,
    data: InterviewSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("workflow.technical_evaluate"),
):
    # Step 1: Save evaluation & score in the interview engine
    result = submit_evaluation(
        db=db,
        candidate_id=candidate_id,
        responses=data.responses,
        overall_remarks=data.overall_remarks or "",
    )
    
    if result.get("success") is False:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content=result)

    # Step 2: Trigger the workflow transition within the same transaction context
    # submit_technical_round_evaluation calls db.commit() at the end, 
    # persisting everything atomically.
    workflow_result = submit_technical_round_evaluation(
        db=db,
        candidate_id=candidate_id,
        round_number=data.round_number,
        status_selection=data.status_selection,
        remarks=data.overall_remarks or "",
        evaluation_data=result.get("score", {}),
        next_interviewer_email=data.next_interviewer_email,
        performed_by=current_user.email,
        is_admin=current_user.role == "SYSTEM_ADMIN",
    )

    # Fetch the candidate to get the newly updated candidate_status
    from models.applicant import Applicant
    candidate = db.query(Applicant).filter(Applicant.candidate_id == candidate_id).first()

    return {
        "success": True, 
        "message": "Interview submitted successfully",
        "next_stage": workflow_result.round_type if workflow_result else None,
        "next_assignee": workflow_result.assigned_interviewer if workflow_result else None,
        "candidate_status": candidate.status if candidate else None,
        "technical_score": result.get("score", {}).get("overall_percentage"),
        "recommendation": result.get("score", {}).get("recommendation"),
        "interview_engine_result": result,
    }


# ── Results & Summary ──────────────────────────────────────────

@router.get("/result/{candidate_id}")
def get_interview_result(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("evaluation.view_all"),
):
    result = get_result(db, candidate_id)
    if not result:
        return {"success": True, "score": None, "message": "No interview results found."}
    return {"success": True, "score": result}


@router.get("/summary/{candidate_id}")
def get_interview_summary(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("evaluation.view_all"),
):
    summary = get_summary(db, candidate_id)
    if not summary:
        return {"success": True, "summary": None, "message": "No interview summary found."}
    return {"success": True, "summary": summary}
