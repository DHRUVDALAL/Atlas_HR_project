"""
Employee Onboarding — Pydantic Schemas

Request/Response schemas for onboarding CRUD, verification, asset allocation, and API serialization.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import date, datetime
from uuid import UUID


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class OnboardingStartRequest(BaseModel):
    """Start onboarding for a candidate."""
    candidate_id: UUID


class OnboardingUpdateRequest(BaseModel):
    """Update onboarding status."""
    status: Optional[str] = Field(None, max_length=20)


class ChecklistUpdateRequest(BaseModel):
    """Update a checklist item."""
    is_completed: bool


class DocumentVerifyRequest(BaseModel):
    """Verify or reject a document."""
    notes: Optional[str] = Field(None, max_length=2000)


class BGVUpdateRequest(BaseModel):
    """Clear or fail a background check."""
    notes: Optional[str] = Field(None, max_length=2000)


class AssetAllocateRequest(BaseModel):
    """Allocate an IT asset."""
    asset_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class VerificationItemResponse(BaseModel):
    """Single verification item (document or BGV)."""
    status: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class AssetItemResponse(BaseModel):
    """Single asset item."""
    status: str
    asset_id: Optional[str] = None
    allocated_by: Optional[str] = None
    allocated_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ChecklistItemResponse(BaseModel):
    """Single checklist item."""
    item_name: str
    is_completed: bool
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OnboardingActivityResponse(BaseModel):
    """Single activity log entry."""
    activity_id: UUID
    action: str
    performed_by: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OnboardingResponse(BaseModel):
    """Onboarding detail response."""
    onboarding_id: UUID
    candidate_id: UUID
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    documents: List[VerificationItemResponse] = []
    background_checks: List[VerificationItemResponse] = []
    assets: List[AssetItemResponse] = []
    checklist: List[ChecklistItemResponse] = []
    activities: List[OnboardingActivityResponse] = []

    class Config:
        from_attributes = True


class OnboardingListResponse(BaseModel):
    """Onboarding list item (summary)."""
    onboarding_id: UUID
    candidate_id: UUID
    application_number: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    progress_percent: int = 0

    class Config:
        from_attributes = True


class OnboardingStatsResponse(BaseModel):
    """Dashboard statistics for onboarding."""
    total_employees: int = 0
    in_progress: int = 0
    completed: int = 0
    documents_pending: int = 0
    bgv_pending: int = 0
    assets_pending: int = 0
    onboarding_this_month: int = 0
