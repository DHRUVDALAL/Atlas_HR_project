from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from services.email_service import send_email, process_email_queue
from services.email_template_service import get_template, render_template, render_subject
from services.notification_service import create_notification


def _try_send_email(
    db: Session,
    to_email: str,
    to_name: Optional[str],
    template_code: str,
    variables: Dict[str, Any],
    fallback_subject: str,
    fallback_html: str,
    notification_user_id: Optional[UUID] = None,
    notification_title: Optional[str] = None,
    notification_message: Optional[str] = None,
    notification_category: str = "workflow",
    notification_action_url: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    try:
        template = get_template(db, template_code)
        subject = render_subject(template, variables)
        html, text = render_template(template, variables)
        send_email(
            db=db,
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            body_html=html,
            body_text=text,
            template_code=template_code,
            meta=meta,
        )
    except Exception:
        send_email(
            db=db,
            to_email=to_email,
            to_name=to_name,
            subject=fallback_subject,
            body_html=fallback_html,
            body_text=fallback_subject,
            template_code=template_code,
            meta=meta,
        )

    if notification_user_id and notification_title and notification_message:
        create_notification(
            db=db,
            user_id=notification_user_id,
            title=notification_title,
            message=notification_message,
            category=notification_category,
            action_url=notification_action_url,
        )
    
    # Process the queue immediately so emails go out synchronously with the background task
    try:
        process_email_queue(db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to process email queue inline: {e}")


def trigger_registration_email(
    db: Session,
    to_email: str,
    candidate_name: str,
    application_number: str,
    position: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=candidate_name,
        template_code="candidate_registered",
        variables={
            "candidate_name": candidate_name,
            "application_number": application_number,
            "position": position,
        },
        fallback_subject=f"Registration Confirmation - {application_number}",
        fallback_html=f"<p>Dear {candidate_name}, your application {application_number} for {position} has been registered.</p>",
    )


def trigger_interview_scheduled_email(
    db: Session,
    to_email: str,
    candidate_name: str,
    round: str,
    interview_date: str,
    interview_time: str,
    interviewer_name: str,
    mode: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=candidate_name,
        template_code="interview_scheduled",
        variables={
            "candidate_name": candidate_name,
            "round": round,
            "interview_date": interview_date,
            "interview_time": interview_time,
            "interviewer_name": interviewer_name,
            "mode": mode,
        },
        fallback_subject=f"Interview Scheduled - {round}",
        fallback_html=f"<p>Dear {candidate_name}, your {round} interview is scheduled for {interview_date} at {interview_time}.</p>",
    )


def trigger_interview_reminder_email(
    db: Session,
    to_email: str,
    candidate_name: str,
    round: str,
    interview_date: str,
    interview_time: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=candidate_name,
        template_code="interview_reminder",
        variables={
            "candidate_name": candidate_name,
            "round": round,
            "interview_date": interview_date,
            "interview_time": interview_time,
        },
        fallback_subject=f"Interview Reminder - {round}",
        fallback_html=f"<p>Dear {candidate_name}, reminder: your {round} interview is on {interview_date} at {interview_time}.</p>",
    )


def trigger_offer_email(
    db: Session,
    to_email: str,
    candidate_name: str,
    position: str,
    offer_id: str,
    ctc: str,
    joining_date: str,
    validity_days: int,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=candidate_name,
        template_code="offer_generated",
        variables={
            "candidate_name": candidate_name,
            "position": position,
            "offer_id": offer_id,
            "ctc": ctc,
            "joining_date": joining_date,
            "validity_days": str(validity_days),
        },
        fallback_subject=f"Offer Letter - {position}",
        fallback_html=f"<p>Dear {candidate_name}, we are pleased to extend an offer for {position}. CTC: {ctc}. Joining: {joining_date}.</p>",
    )


def trigger_offer_accepted_email(
    db: Session,
    to_email: str,
    candidate_name: str,
    position: str,
    joining_date: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=candidate_name,
        template_code="offer_accepted",
        variables={
            "candidate_name": candidate_name,
            "position": position,
            "joining_date": joining_date,
        },
        fallback_subject="Offer Accepted",
        fallback_html=f"<p>Dear {candidate_name}, thank you for accepting the offer. Welcome to the team!</p>",
    )


def trigger_onboarding_started_email(
    db: Session,
    to_email: str,
    employee_name: str,
    employee_id: str,
    position: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=employee_name,
        template_code="onboarding_started",
        variables={
            "employee_name": employee_name,
            "employee_id": employee_id,
            "position": position,
        },
        fallback_subject="Welcome to ATLAS!",
        fallback_html=f"<p>Dear {employee_name}, your onboarding has been initiated. Employee ID: {employee_id}.</p>",
    )


def trigger_employee_activated_email(
    db: Session,
    to_email: str,
    employee_name: str,
    employee_id: str,
    position: str,
    department: str,
):
    _try_send_email(
        db=db,
        to_email=to_email,
        to_name=employee_name,
        template_code="employee_activated",
        variables={
            "employee_name": employee_name,
            "employee_id": employee_id,
            "position": position,
            "department": department,
        },
        fallback_subject="Welcome Aboard!",
        fallback_html=f"<p>Dear {employee_name}, congratulations! Your onboarding is complete. Employee ID: {employee_id}.</p>",
    )
