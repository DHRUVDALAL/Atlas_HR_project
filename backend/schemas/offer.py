"""
Offer Management — Pydantic Schemas

Request/Response schemas for offer CRUD, status changes, and API serialization.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class OfferCreateRequest(BaseModel):
    """Create a new offer for a candidate."""
    candidate_id: UUID
    offered_ctc: Optional[float] = Field(None, ge=0)
    joining_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=5000)

    @model_validator(mode="after")
    def validate_offer(self):
        if self.offered_ctc is not None and self.offered_ctc <= 0:
            raise ValueError("Offered CTC must be greater than 0")
        return self


class OfferUpdateRequest(BaseModel):
    """Update offer details."""
    offered_ctc: Optional[float] = Field(None, ge=0)
    joining_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=5000)


class OfferStatusRequest(BaseModel):
    """Change offer status (send, accept, decline)."""
    notes: Optional[str] = Field(None, max_length=2000)


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class OfferHistoryResponse(BaseModel):
    """Single history entry."""
    history_id: UUID
    action: str
    performed_by: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfferDocumentResponse(BaseModel):
    """Single document entry."""
    document_id: UUID
    document_type: str
    file_name: str
    uploaded_by: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class OfferResponse(BaseModel):
    """Offer detail response."""
    offer_id: UUID
    candidate_id: UUID
    status: str
    offered_ctc: Optional[float] = None
    joining_date: Optional[date] = None
    approved_by: Optional[str] = None
    sent_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    history: List[OfferHistoryResponse] = []
    documents: List[OfferDocumentResponse] = []

    class Config:
        from_attributes = True


class OfferListResponse(BaseModel):
    """Offer list item (summary)."""
    offer_id: UUID
    candidate_id: UUID
    application_number: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    status: str
    offered_ctc: Optional[float] = None
    joining_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfferStatsResponse(BaseModel):
    """Dashboard statistics for offers."""
    total_offers: int = 0
    pending_offers: int = 0
    accepted_offers: int = 0
    declined_offers: int = 0
    avg_processing_days: float = 0.0
    offers_this_month: int = 0
