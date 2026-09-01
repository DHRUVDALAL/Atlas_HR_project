from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, Any, Dict, List
from datetime import date, datetime
from uuid import UUID


class ReceptionistForwardRequest(BaseModel):
    remarks: Optional[str] = Field(None, max_length=500)


class ReceptionistRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


class HRReviewRequest(BaseModel):
    domain: str = Field(..., min_length=1, max_length=100)
    experience_bracket: Optional[str] = Field(None, max_length=20)
    number_of_tech_rounds: int = Field(..., ge=1, le=10)
    hr_status: str = Field(..., max_length=20)  # SELECT, REJECT, HOLD
    first_interviewer_email: EmailStr
    evaluation_data: Dict[str, Any] = Field(default={})

    @field_validator("hr_status")
    @classmethod
    def validate_hr_status(cls, v):
        upper = v.upper()
        if upper not in ("SELECT", "REJECT", "HOLD"):
            raise ValueError("Status must be SELECT, REJECT, or HOLD")
        return upper


class TechnicalEvaluationRequest(BaseModel):
    status_selection: str = Field(..., max_length=20)  # COMPLETED, REJECTED, HOLD
    remarks: str = Field("", max_length=2000)
    evaluation_data: Dict[str, Any] = Field(default={})
    next_interviewer_email: Optional[EmailStr] = None

    @field_validator("status_selection")
    @classmethod
    def validate_status_selection(cls, v):
        upper = v.upper()
        if upper not in ("COMPLETED", "REJECTED", "HOLD"):
            raise ValueError("Status must be COMPLETED, REJECTED, or HOLD")
        return upper


class CEOReviewRequest(BaseModel):
    remarks: str = Field(..., min_length=5, max_length=2000)
    evaluation_data: Dict[str, Any] = Field(default={})
    save_draft: bool = True
    ceo_status: str = "SELECT"


class FinalDecisionRequest(BaseModel):
    final_status: Optional[str] = Field(None, max_length=20)  # SELECTED, REJECTED, HOLD
    offered_ctc: Optional[float] = Field(None, ge=0)
    joining_date: Optional[date] = None
    approved_by: Optional[str] = Field(None, max_length=100)
    final_remarks: Optional[str] = Field(None, max_length=2000)
    hr_discussion_notes: Optional[str] = Field(None, max_length=5000)
    hr_discussion: Optional[str] = Field(None, max_length=5000)
    ceo_discussion: Optional[str] = Field(None, max_length=5000)
    save_draft: bool = False

    @field_validator("final_status")
    @classmethod
    def validate_final_status(cls, v):
        if v is None:
            return v
        upper = v.upper()
        if upper not in ("SELECTED", "REJECTED", "HOLD", "DRAFT"):
            raise ValueError("Status must be SELECTED, REJECTED, HOLD or DRAFT")
        return upper

    @model_validator(mode="after")
    def validate_requirements(self):
        if self.save_draft:
            return self
        
        # If not draft, final_status is mandatory
        if not self.final_status:
            raise ValueError("Final status is mandatory")
            
        if self.final_status == "SELECTED":
            if self.joining_date is None:
                raise ValueError("Joining date must be provided when final status is SELECTED")
            if self.offered_ctc is None or self.offered_ctc <= 0:
                raise ValueError("Offered CTC must be provided and greater than 0 when final status is SELECTED")
        return self


# Response Schemas

class ActivityLogResponse(BaseModel):
    log_id: UUID
    action: str
    performed_by: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class InterviewRoundResponse(BaseModel):
    round_id: UUID
    round_number: int
    round_type: str
    assigned_interviewer: str
    next_interviewer_email: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    evaluation_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FinalDecisionResponse(BaseModel):
    decision_id: UUID
    final_status: str
    offered_ctc: Optional[float] = None
    joining_date: Optional[date] = None
    approved_by: Optional[str] = None
    final_remarks: Optional[str] = None
    decision_date: datetime
    hr_discussion: Optional[str] = None
    ceo_discussion: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
