"""Pydantic schemas for the Interview Engine API."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID


# ── Request schemas ──────────────────────────────────────────────

class InterviewAssignRequest(BaseModel):
    candidate_id: str
    domain_code: str
    experience_bracket_code: str
    assigned_interviewer: str
    interview_round: int = 1


class InterviewSaveRequest(BaseModel):
    responses: List[Dict[str, Any]]


class InterviewSubmitRequest(BaseModel):
    responses: List[Dict[str, Any]]
    overall_remarks: Optional[str] = ""
    status_selection: str = "COMPLETED"
    round_number: int = 1
    next_interviewer_email: Optional[str] = None


# ── Response schemas ─────────────────────────────────────────────

class DomainResponse(BaseModel):
    id: str
    code: str
    name: str


class ExperienceBracketResponse(BaseModel):
    id: str
    code: str
    label: str
    min_years: float
    max_years: Optional[float]


class TechnicalQuestionResponse(BaseModel):
    id: str
    question_id_code: str
    module_code: str
    module_name: str
    topic_category: str
    question_topic: str
    source: Optional[str]
    difficulty: Optional[str]
    weight: Optional[float]


class InterviewAssignmentResponse(BaseModel):
    id: str
    candidate_id: str
    domain_code: str
    experience_bracket_code: str
    assigned_interviewer: str
    assigned_by: str
    interview_round: int
    status: str
    created_at: Optional[str]


class InterviewResponseItem(BaseModel):
    id: str
    topic_id: str
    rating: Optional[int]
    comment: Optional[str]
    question_id_code: Optional[str] = None
    question_topic: Optional[str] = None
    topic_category: Optional[str] = None
    module_code: Optional[str] = None


class InterviewScoreResponse(BaseModel):
    id: str
    assignment_id: str
    topic_scores: Optional[Dict[str, Any]]
    overall_percentage: Optional[float]
    recommendation: Optional[str]
    total_questions: Optional[int]
    answered_questions: Optional[int]
    average_rating: Optional[float]
    highest_topic: Optional[str]
    weakest_topic: Optional[str]
    calculated_at: Optional[str]


class InterviewSummaryResponse(BaseModel):
    id: str
    assignment_id: str
    summary_json: Optional[Dict[str, Any]]
    generated_at: Optional[str]


class TopicGroupResponse(BaseModel):
    topic_category: str
    questions: List[TechnicalQuestionResponse]


class InterviewProgressResponse(BaseModel):
    assignment_id: str
    responses: List[InterviewResponseItem]
    is_submitted: bool
