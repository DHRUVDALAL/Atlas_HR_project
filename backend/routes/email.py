from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from schemas.email import (
    SendEmailRequest,
    SendTemplateEmailRequest,
    EmailHistoryResponse,
    EmailStatsResponse,
    EmailTemplateResponse,
    EmailTemplateUpdateRequest,
)
from services.email_service import (
    send_email,
    process_email_queue,
    retry_failed_emails,
    get_email_history,
    get_email_stats,
)
from services.email_template_service import (
    get_template,
    render_template,
    render_subject,
    list_templates,
    update_template,
    seed_email_templates,
)

router = APIRouter(prefix="/api/email", tags=["Email Management"])


@router.post("/send", response_model=EmailHistoryResponse)
def send_email_direct(
    data: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.send"),
):
    history = send_email(
        db=db,
        to_email=data.to_email,
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        to_name=data.to_name,
        template_code=data.template_code,
        priority=data.priority,
        scheduled_at=data.scheduled_at,
        meta=data.meta,
    )
    return history


@router.post("/send-template", response_model=EmailHistoryResponse)
def send_template_email(
    data: SendTemplateEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.send"),
):
    template = get_template(db, data.template_code)
    subject = render_subject(template, data.variables)
    html, text = render_template(template, data.variables)

    history = send_email(
        db=db,
        to_email=data.to_email,
        to_name=data.to_name,
        subject=subject,
        body_html=html,
        body_text=text,
        template_code=data.template_code,
        priority=data.priority,
        scheduled_at=data.scheduled_at,
        meta=data.meta,
    )
    return history


@router.post("/process-queue")
def process_queue(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.admin"),
):
    results = process_email_queue(db, limit=limit)
    return {"processed": len(results), "results": results}


@router.post("/retry-failed")
def retry_failed(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.admin"),
):
    results = retry_failed_emails(db, limit=limit)
    return {"retried": len(results), "ids": results}


@router.get("/history")
def list_email_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    recipient: Optional[str] = Query(None),
    template_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.view"),
):
    items, total = get_email_history(db, skip=skip, limit=limit, status=status, recipient=recipient, template_code=template_code)
    return {
        "items": [EmailHistoryResponse.model_validate(i) for i in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats", response_model=EmailStatsResponse)
def email_stats(
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.view"),
):
    return get_email_stats(db)


@router.get("/templates")
def get_templates(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.view"),
):
    templates = list_templates(db, category=category)
    return [EmailTemplateResponse.model_validate(t) for t in templates]


@router.put("/templates/{code}", response_model=EmailTemplateResponse)
def update_email_template(
    code: str,
    data: EmailTemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.admin"),
):
    return update_template(
        db=db,
        code=code,
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        is_active=data.is_active,
        variables=data.variables,
    )


@router.post("/seed-templates")
def seed_templates(
    db: Session = Depends(get_db),
    current_user: User = require_permission("email.admin"),
):
    count = seed_email_templates(db)
    return {"seeded": count}
