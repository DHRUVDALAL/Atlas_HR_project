"""
Interview Engine — Business logic service.

Handles:
  - Question loading by domain + experience bracket
  - Candidate assignment management
  - Response saving (auto-save)
  - Score calculation
  - Summary generation
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from fastapi import HTTPException, status

from models.interview_engine import (
    SapDomain,
    ExperienceBracket,
    TechnicalTopic,
    CandidateInterviewAssignment,
    InterviewResponse,
    InterviewScore,
    InterviewSummary,
)
from models.applicant import CandidateActivityLog

logger = logging.getLogger(__name__)

# ── Lazy initialization safety net ──────────────────────────────

_reference_data_seeded = False


def _ensure_reference_data(db: Session) -> None:
    """Ensure domains and brackets exist. Called lazily on first API request."""
    global _reference_data_seeded
    if _reference_data_seeded:
        return
    # Check if data already exists (another worker may have seeded)
    domain_count = db.query(SapDomain).count()
    if domain_count > 0:
        _reference_data_seeded = True
        return
    try:
        from services.excel_import_service import seed_interview_reference_data
        result = seed_interview_reference_data(db)
        logger.info("Reference data seed: %s", result)
        _reference_data_seeded = True
    except Exception as e:
        logger.error("Failed to seed reference data: %s", e)
        # Don't set flag — retry on next request

# ── Recommendation thresholds ───────────────────────────────────

RECOMMENDATION_THRESHOLDS = [
    (90, "Excellent"),
    (80, "Very Strong"),
    (70, "Strong"),
    (60, "Average"),
    (0, "Needs Improvement"),
]


def _recommendation_for_pct(pct: float) -> str:
    for threshold, label in RECOMMENDATION_THRESHOLDS:
        if pct >= threshold:
            return label
    return "Needs Improvement"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _log_activity(
    db: Session,
    candidate_id: uuid.UUID,
    action: str,
    performed_by: str,
    details: Optional[str] = None,
) -> None:
    log = CandidateActivityLog(
        log_id=uuid.uuid4(),
        candidate_id=candidate_id,
        action=action,
        performed_by=performed_by,
        details=details,
    )
    db.add(log)
    db.flush()


# ── Domain & Bracket lookups ────────────────────────────────────

def list_domains(db: Session) -> List[Dict[str, Any]]:
    _ensure_reference_data(db)
    domains = db.query(SapDomain).order_by(SapDomain.code).all()
    return [{"id": str(d.id), "code": d.code, "name": d.name, "description": d.description} for d in domains]


def list_experience_brackets(db: Session) -> List[Dict[str, Any]]:
    _ensure_reference_data(db)
    brackets = db.query(ExperienceBracket).order_by(ExperienceBracket.min_years).all()
    return [
        {
            "id": str(b.id),
            "code": b.code,
            "label": b.label,
            "min_years": b.min_years,
            "max_years": b.max_years,
        }
        for b in brackets
    ]


# ── Question loading ────────────────────────────────────────────

def get_questions_for_domain_experience(
    db: Session,
    domain_code: str,
    experience_bracket_code: str,
) -> List[Dict[str, Any]]:
    _ensure_reference_data(db)
    domain = db.query(SapDomain).filter(SapDomain.code == domain_code.upper()).first()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{domain_code}' not found.",
        )
    bracket = db.query(ExperienceBracket).filter(
        ExperienceBracket.code == experience_bracket_code
    ).first()
    if not bracket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience bracket '{experience_bracket_code}' not found.",
        )

    topics = (
        db.query(TechnicalTopic)
        .filter(
            TechnicalTopic.domain_id == domain.id,
            TechnicalTopic.experience_bracket_id == bracket.id,
        )
        .order_by(TechnicalTopic.topic_category, TechnicalTopic.question_id_code)
        .all()
    )

    # Step 10: Debugging logging as requested
    logger.info(
        "DEBUG: Retreiving questions - Domain: %s, Bracket: %s, Total Found: %d", 
        domain_code, experience_bracket_code, len(topics)
    )
    if topics:
        logger.info("DEBUG: First few Question IDs: %s", [t.question_id_code for t in topics[:5]])
    else:
        logger.warning(
            "DEBUG: No questions found! Domain ID: %s, Bracket ID: %s", 
            domain.id, bracket.id
        )

    return [
        {
            "id": str(t.id),
            "question_id_code": t.question_id_code,
            "module_code": t.module_code,
            "module_name": t.module_name,
            "topic_category": t.topic_category,
            "question_topic": t.question_topic,
            "source": t.source,
            "difficulty": t.difficulty,
            "weight": t.weight,
        }
        for t in topics
    ]


def get_questions_grouped_by_category(
    db: Session,
    domain_code: str,
    experience_bracket_code: str,
) -> List[Dict[str, Any]]:
    questions = get_questions_for_domain_experience(db, domain_code, experience_bracket_code)
    grouped: Dict[str, List[Dict]] = {}
    for q in questions:
        cat = q["topic_category"]
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(q)

    return [
        {"topic_category": cat, "questions": qs}
        for cat, qs in grouped.items()
    ]


# ── Assignment management ───────────────────────────────────────

def create_assignment(
    db: Session,
    candidate_id: str,
    domain_code: str,
    experience_bracket_code: str,
    assigned_interviewer: str,
    assigned_by: str,
    interview_round: int = 1,
) -> Dict[str, Any]:
    _ensure_reference_data(db)
    domain = db.query(SapDomain).filter(SapDomain.code == domain_code.upper()).first()
    if not domain:
        raise HTTPException(status_code=400, detail=f"Domain '{domain_code}' not found.")
    bracket = db.query(ExperienceBracket).filter(
        ExperienceBracket.code == experience_bracket_code
    ).first()
    if not bracket:
        raise HTTPException(status_code=400, detail=f"Experience bracket '{experience_bracket_code}' not found.")

    try:
        cid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID.")

    existing = db.query(CandidateInterviewAssignment).filter(
        CandidateInterviewAssignment.candidate_id == cid,
        CandidateInterviewAssignment.interview_round == interview_round,
    ).first()

    if existing:
        existing.domain_id = domain.id
        existing.experience_bracket_id = bracket.id
        existing.assigned_interviewer = assigned_interviewer
        existing.status = "ACTIVE"
        existing.updated_at = _now_utc()
        assignment = existing
    else:
        assignment = CandidateInterviewAssignment(
            id=uuid.uuid4(),
            candidate_id=cid,
            domain_id=domain.id,
            experience_bracket_id=bracket.id,
            assigned_interviewer=assigned_interviewer,
            assigned_by=assigned_by,
            interview_round=interview_round,
            status="ACTIVE",
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)

    _log_activity(
        db, cid, "Interview Assignment Created", assigned_by,
        f"Domain: {domain_code}, Bracket: {experience_bracket_code}, Interviewer: {assigned_interviewer}",
    )

    return {
        "id": str(assignment.id),
        "candidate_id": str(assignment.candidate_id),
        "domain_code": domain_code.upper(),
        "experience_bracket_code": experience_bracket_code,
        "assigned_interviewer": assignment.assigned_interviewer,
        "assigned_by": assignment.assigned_by,
        "interview_round": assignment.interview_round,
        "status": assignment.status,
        "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
    }


def get_assignment_for_candidate(
    db: Session,
    candidate_id: str,
) -> Optional[Dict[str, Any]]:
    try:
        cid = uuid.UUID(candidate_id)
    except ValueError:
        return None

    assignment = (
        db.query(CandidateInterviewAssignment)
        .filter(CandidateInterviewAssignment.candidate_id == cid)
        .order_by(CandidateInterviewAssignment.created_at.desc())
        .first()
    )
    if not assignment:
        return None

    domain = db.query(SapDomain).filter(SapDomain.id == assignment.domain_id).first()
    bracket = db.query(ExperienceBracket).filter(
        ExperienceBracket.id == assignment.experience_bracket_id
    ).first()

    return {
        "id": str(assignment.id),
        "candidate_id": str(assignment.candidate_id),
        "domain_code": domain.code if domain else None,
        "domain_name": domain.name if domain else None,
        "experience_bracket_code": bracket.code if bracket else None,
        "experience_bracket_label": bracket.label if bracket else None,
        "assigned_interviewer": assignment.assigned_interviewer,
        "assigned_by": assignment.assigned_by,
        "interview_round": assignment.interview_round,
        "status": assignment.status,
        "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
    }


# ── Auto-save ───────────────────────────────────────────────────

def save_progress(
    db: Session,
    assignment_id: str,
    responses: List[Dict[str, Any]],
) -> Dict[str, Any]:
    assignment = db.query(CandidateInterviewAssignment).filter(
        CandidateInterviewAssignment.id == uuid.UUID(assignment_id)
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Clear existing responses for this assignment
    db.query(InterviewResponse).filter(
        InterviewResponse.assignment_id == assignment.id
    ).delete()

    saved = []
    for r in responses:
        topic_id = r.get("topic_id")
        if not topic_id:
            continue
        response = InterviewResponse(
            id=uuid.uuid4(),
            assignment_id=assignment.id,
            topic_id=uuid.UUID(topic_id),
            rating=r.get("rating"),
            comment=r.get("comment", ""),
        )
        db.add(response)
        saved.append(str(response.id))

    db.commit()
    logger.info("Auto-saved %d responses for assignment %s", len(saved), assignment_id)

    return {"saved_count": len(saved), "assignment_id": assignment_id}


def load_progress(
    db: Session,
    assignment_id: str,
) -> Dict[str, Any]:
    try:
        aid = uuid.UUID(assignment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment ID.")

    assignment = db.query(CandidateInterviewAssignment).filter(
        CandidateInterviewAssignment.id == aid
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    responses = (
        db.query(InterviewResponse)
        .filter(InterviewResponse.assignment_id == aid)
        .all()
    )

    response_list = []
    for resp in responses:
        topic = db.query(TechnicalTopic).filter(TechnicalTopic.id == resp.topic_id).first()
        response_list.append({
            "id": str(resp.id),
            "topic_id": str(resp.topic_id),
            "rating": resp.rating,
            "comment": resp.comment,
            "question_id_code": topic.question_id_code if topic else None,
            "question_topic": topic.question_topic if topic else None,
            "topic_category": topic.topic_category if topic else None,
            "module_code": topic.module_code if topic else None,
        })

    score = db.query(InterviewScore).filter(InterviewScore.assignment_id == aid).first()

    return {
        "assignment_id": assignment_id,
        "responses": response_list,
        "is_submitted": score is not None,
    }


# ── Score calculation ───────────────────────────────────────────

def calculate_scores(
    db: Session,
    assignment_id: str,
) -> Dict[str, Any]:
    assignment = db.query(CandidateInterviewAssignment).filter(
        CandidateInterviewAssignment.id == uuid.UUID(assignment_id)
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    domain = db.query(SapDomain).filter(SapDomain.id == assignment.domain_id).first()
    bracket = db.query(ExperienceBracket).filter(
        ExperienceBracket.id == assignment.experience_bracket_id
    ).first()

    if not domain or not bracket:
        raise HTTPException(status_code=500, detail="Assignment has invalid domain or bracket.")

    questions = (
        db.query(TechnicalTopic)
        .filter(
            TechnicalTopic.domain_id == assignment.domain_id,
            TechnicalTopic.experience_bracket_id == assignment.experience_bracket_id,
        )
        .all()
    )

    responses = (
        db.query(InterviewResponse)
        .filter(InterviewResponse.assignment_id == assignment.id)
        .all()
    )
    response_map = {str(r.topic_id): r for r in responses}

    total_questions = len(questions)
    answered_questions = 0
    total_rating = 0.0
    topic_scores: Dict[str, Dict] = {}

    for q in questions:
        cat = q.topic_category
        if cat not in topic_scores:
            topic_scores[cat] = {"total": 0, "answered": 0, "sum_rating": 0.0}

        topic_scores[cat]["total"] += 1

        resp = response_map.get(str(q.id))
        if resp and resp.rating is not None:
            answered_questions += 1
            total_rating += resp.rating
            topic_scores[cat]["answered"] += 1
            topic_scores[cat]["sum_rating"] += resp.rating

    # Calculate per-topic averages
    topic_averages: Dict[str, float] = {}
    for cat, data in topic_scores.items():
        if data["answered"] > 0:
            topic_averages[cat] = round(data["sum_rating"] / data["answered"], 2)
        else:
            topic_averages[cat] = 0.0

    # Overall percentage (scale of 5 → 100%)
    if total_questions > 0 and answered_questions > 0:
        overall_pct = round((total_rating / (answered_questions * 5)) * 100, 1)
    else:
        overall_pct = 0.0

    avg_rating = round(total_rating / answered_questions, 2) if answered_questions > 0 else 0.0

    # Find highest and weakest topics
    highest_topic = max(topic_averages, key=topic_averages.get) if topic_averages else None
    weakest_topic = min(topic_averages, key=topic_averages.get) if topic_averages else None
    if topic_averages:
        if topic_averages[highest_topic] == 0:
            highest_topic = None
        if topic_averages[weakest_topic] == 0:
            weakest_topic = None

    recommendation = _recommendation_for_pct(overall_pct)

    # Upsert score
    existing_score = db.query(InterviewScore).filter(
        InterviewScore.assignment_id == assignment.id
    ).first()

    score_data = {
        "topic_scores": topic_averages,
        "overall_percentage": overall_pct,
        "recommendation": recommendation,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "average_rating": avg_rating,
        "highest_topic": highest_topic,
        "weakest_topic": weakest_topic,
        "calculated_at": _now_utc(),
    }

    if existing_score:
        for k, v in score_data.items():
            setattr(existing_score, k, v)
        score_record = existing_score
    else:
        score_record = InterviewScore(
            id=uuid.uuid4(),
            assignment_id=assignment.id,
            **score_data,
        )
        db.add(score_record)

    db.flush()

    logger.info(
        "Calculated scores for assignment %s: %.1f%% (%s)",
        assignment_id, overall_pct, recommendation,
    )

    return {
        "id": str(score_record.id),
        "assignment_id": str(assignment_id),
        "topic_scores": topic_averages,
        "overall_percentage": overall_pct,
        "recommendation": recommendation,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "average_rating": avg_rating,
        "highest_topic": highest_topic,
        "weakest_topic": weakest_topic,
        "calculated_at": score_record.calculated_at.isoformat() if score_record.calculated_at else None,
    }


def submit_evaluation(
    db: Session,
    candidate_id: str,
    responses: List[Dict[str, Any]],
    overall_remarks: str = "",
) -> Dict[str, Any]:
    """
    Submit the full evaluation: save responses, calculate scores, generate summary.
    """
    try:
        cid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID.")

    assignment = (
        db.query(CandidateInterviewAssignment)
        .filter(CandidateInterviewAssignment.candidate_id == cid)
        .order_by(CandidateInterviewAssignment.created_at.desc())
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="No interview assignment found for this candidate.")

    questions = (
        db.query(TechnicalTopic)
        .filter(
            TechnicalTopic.domain_id == assignment.domain_id,
            TechnicalTopic.experience_bracket_id == assignment.experience_bracket_id,
        )
        .all()
    )
    
    expected_ids = {str(q.id): q for q in questions}
    received_ids = {r["topic_id"] for r in responses if r.get("rating") is not None}
    missing_ids = set(expected_ids.keys()) - received_ids

    # Step 2 & 11: Developer diagnostics
    logger.info("=== SUBMISSION DIAGNOSTICS ===")
    logger.info(f"Candidate ID: {assignment.candidate_id}")
    logger.info(f"Round: {assignment.interview_round}")
    logger.info(f"Domain ID: {assignment.domain_id}")
    logger.info(f"Experience Bracket ID: {assignment.experience_bracket_id}")
    logger.info(f"Received Question IDs: {list(received_ids)}")
    logger.info(f"Expected Question IDs: {list(expected_ids.keys())}")
    logger.info(f"Missing IDs: {list(missing_ids)}")
    logger.info(f"Expected question count: {len(expected_ids)}")
    logger.info(f"Received answer count: {len(received_ids)}")

    if missing_ids:
        missing_id = list(missing_ids)[0]
        missing_q = expected_ids[missing_id]
        logger.error(f"Validating candidate...\n\nExpected Questions:\n{len(expected_ids)}\n\nReceived Ratings:\n{len(received_ids)}\n\nMissing:\n{missing_q.question_id_code}\n\nQuestion:\n{missing_q.question_topic}")
        
        # Step 7: Improve validation response
        return {
            "success": False,
            "reason": "Missing Question",
            "question_id": missing_q.question_id_code,
            "question": missing_q.question_topic,
            "candidate": str(assignment.candidate_id),
            "expected": len(expected_ids),
            "received": len(received_ids)
        }

    # Save responses (clear old + insert new)
    db.query(InterviewResponse).filter(
        InterviewResponse.assignment_id == assignment.id
    ).delete()

    for r in responses:
        topic_id = r.get("topic_id")
        if not topic_id:
            continue
        response = InterviewResponse(
            id=uuid.uuid4(),
            assignment_id=assignment.id,
            topic_id=uuid.UUID(topic_id),
            rating=r.get("rating"),
            comment=r.get("comment", ""),
        )
        db.add(response)

    db.flush()

    _log_activity(
        db, cid, "Interview Submitted", assignment.assigned_interviewer,
        f"Assignment {assignment.id}: {len(responses)} responses saved.",
    )

    # Calculate scores
    score_result = calculate_scores(db, str(assignment.id))

    # Generate summary
    summary_result = generate_summary(db, str(assignment.id), overall_remarks)

    _log_activity(
        db, cid, "Interview Score Calculated", "SYSTEM",
        f"Overall: {score_result['overall_percentage']}% — {score_result['recommendation']}",
    )

    _log_activity(
        db, cid, "Interview Summary Generated", "SYSTEM",
        f"Summary generated for assignment {assignment.id}",
    )

    return {
        "score": score_result,
        "summary": summary_result,
    }


def generate_summary(
    db: Session,
    assignment_id: str,
    overall_remarks: str = "",
) -> Dict[str, Any]:
    """Generate a structured interview summary."""
    assignment = db.query(CandidateInterviewAssignment).filter(
        CandidateInterviewAssignment.id == uuid.UUID(assignment_id)
    ).first()
    if not assignment:
        return {}

    score = db.query(InterviewScore).filter(
        InterviewScore.assignment_id == assignment.id
    ).first()

    domain = db.query(SapDomain).filter(SapDomain.id == assignment.domain_id).first()
    bracket = db.query(ExperienceBracket).filter(
        ExperienceBracket.id == assignment.experience_bracket_id
    ).first()

    responses = (
        db.query(InterviewResponse)
        .filter(InterviewResponse.assignment_id == assignment.id)
        .all()
    )

    topic_comments = {}
    for resp in responses:
        if resp.comment and resp.comment.strip():
            topic = db.query(TechnicalTopic).filter(TechnicalTopic.id == resp.topic_id).first()
            if topic:
                cat = topic.topic_category
                if cat not in topic_comments:
                    topic_comments[cat] = []
                topic_comments[cat].append(resp.comment)

    summary = {
        "candidate_id": str(assignment.candidate_id),
        "domain": domain.code if domain else None,
        "domain_name": domain.name if domain else None,
        "experience_bracket": bracket.code if bracket else None,
        "experience_bracket_label": bracket.label if bracket else None,
        "interview_round": assignment.interview_round,
        "interviewer": assignment.assigned_interviewer,
        "total_questions": score.total_questions if score else 0,
        "answered_questions": score.answered_questions if score else 0,
        "average_rating": score.average_rating if score else 0,
        "highest_topic": score.highest_topic if score else None,
        "weakest_topic": score.weakest_topic if score else None,
        "overall_percentage": score.overall_percentage if score else 0,
        "recommendation": score.recommendation if score else "N/A",
        "topic_scores": score.topic_scores if score else {},
        "topic_comments": topic_comments,
        "overall_remarks": overall_remarks,
        "completion_date": _now_utc().isoformat(),
    }

    # Upsert summary
    existing = db.query(InterviewSummary).filter(
        InterviewSummary.assignment_id == assignment.id
    ).first()
    if existing:
        existing.summary_json = summary
        existing.generated_at = _now_utc()
        summary_record = existing
    else:
        summary_record = InterviewSummary(
            id=uuid.uuid4(),
            assignment_id=assignment.id,
            summary_json=summary,
        )
        db.add(summary_record)

    db.flush()

    return {
        "id": str(summary_record.id),
        "assignment_id": assignment_id,
        "summary_json": summary,
        "generated_at": summary_record.generated_at.isoformat() if summary_record.generated_at else None,
    }


def get_result(db: Session, candidate_id: str) -> Optional[Dict[str, Any]]:
    try:
        cid = uuid.UUID(candidate_id)
    except ValueError:
        return None

    assignment = (
        db.query(CandidateInterviewAssignment)
        .filter(CandidateInterviewAssignment.candidate_id == cid)
        .order_by(CandidateInterviewAssignment.created_at.desc())
        .first()
    )
    if not assignment:
        return None

    score = db.query(InterviewScore).filter(
        InterviewScore.assignment_id == assignment.id
    ).first()
    if not score:
        return None

    return {
        "id": str(score.id),
        "assignment_id": str(assignment.id),
        "topic_scores": score.topic_scores,
        "overall_percentage": score.overall_percentage,
        "recommendation": score.recommendation,
        "total_questions": score.total_questions,
        "answered_questions": score.answered_questions,
        "average_rating": score.average_rating,
        "highest_topic": score.highest_topic,
        "weakest_topic": score.weakest_topic,
        "calculated_at": score.calculated_at.isoformat() if score.calculated_at else None,
    }


def get_summary(db: Session, candidate_id: str) -> Optional[Dict[str, Any]]:
    try:
        cid = uuid.UUID(candidate_id)
    except ValueError:
        return None

    assignment = (
        db.query(CandidateInterviewAssignment)
        .filter(CandidateInterviewAssignment.candidate_id == cid)
        .order_by(CandidateInterviewAssignment.created_at.desc())
        .first()
    )
    if not assignment:
        return None

    summary = db.query(InterviewSummary).filter(
        InterviewSummary.assignment_id == assignment.id
    ).first()
    if not summary:
        return None

    return {
        "id": str(summary.id),
        "assignment_id": str(assignment.id),
        "summary_json": summary.summary_json,
        "generated_at": summary.generated_at.isoformat() if summary.generated_at else None,
    }
