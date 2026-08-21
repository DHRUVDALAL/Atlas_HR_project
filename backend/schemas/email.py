from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class SendEmailRequest(BaseModel):
    to_email: EmailStr
    to_name: Optional[str] = None
    subject: str
    body_html: str
    body_text: Optional[str] = None
    template_code: Optional[str] = None
    priority: int = 0
    scheduled_at: Optional[datetime] = None
    meta: Optional[Dict[str, Any]] = None


class SendTemplateEmailRequest(BaseModel):
    to_email: EmailStr
    to_name: Optional[str] = None
    template_code: str
    variables: Dict[str, Any]
    priority: int = 0
    scheduled_at: Optional[datetime] = None
    meta: Optional[Dict[str, Any]] = None


class EmailHistoryResponse(BaseModel):
    id: UUID
    template_code: Optional[str] = None
    recipient_email: str
    recipient_name: Optional[str] = None
    subject: str
    status: str
    error_message: Optional[str] = None
    retry_count: int
    sent_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailStatsResponse(BaseModel):
    total: int
    sent: int
    failed: int
    queued: int
    pending_in_queue: int


class EmailTemplateResponse(BaseModel):
    code: str
    name: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    category: str
    is_active: bool
    variables: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailTemplateUpdateRequest(BaseModel):
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    is_active: Optional[bool] = None
    variables: Optional[List[str]] = None
