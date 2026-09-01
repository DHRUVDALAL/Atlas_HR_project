import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email import encoders
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session

from models.email import EmailHistory, EmailQueue, EmailTemplate

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "ATLAS HR System")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@atlas.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"


def _create_smtp_connection():
    if not EMAIL_ENABLED:
        return None
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        return server
    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        return None


def send_email(
    db: Session,
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    to_name: Optional[str] = None,
    template_code: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    inline_images: Optional[List[Dict[str, Any]]] = None,
    priority: int = 0,
    scheduled_at: Optional[datetime] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> EmailHistory:
    history = EmailHistory(
        template_code=template_code,
        recipient_email=to_email,
        recipient_name=to_name,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        status="queued",
        meta=meta,
    )
    db.add(history)
    db.flush()

    queue_item = EmailQueue(
        history_id=history.id,
        priority=priority,
        scheduled_at=scheduled_at or datetime.now(timezone.utc),
        max_attempts=3,
    )
    db.add(queue_item)
    db.commit()
    db.refresh(history)
    return history


def process_email_queue(db: Session, limit: int = 10) -> List[str]:
    results = []
    pending = (
        db.query(EmailQueue)
        .filter(
            EmailQueue.locked == False,
            EmailQueue.scheduled_at <= datetime.now(timezone.utc),
            EmailQueue.attempts < EmailQueue.max_attempts,
        )
        .order_by(EmailQueue.priority.desc(), EmailQueue.scheduled_at.asc())
        .limit(limit)
        .with_for_update(skip_locked=True)
        .all()
    )

    for item in pending:
        item.locked = True
        item.locked_at = datetime.now(timezone.utc)
        item.locked_by = "email_worker"
        db.flush()

        history = item.history
        try:
            server = _create_smtp_connection()
            if server is None:
                history.status = "skipped"
                history.error_message = "SMTP not configured"
                item.attempts += 1
                item.locked = False
                db.flush()
                results.append(f"skipped:{history.id}")
                continue

            msg = MIMEMultipart("alternative")
            msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
            msg["To"] = history.recipient_email
            msg["Subject"] = history.subject

            if history.body_text:
                msg.attach(MIMEText(history.body_text, "plain", "utf-8"))
            if history.body_html:
                msg.attach(MIMEText(history.body_html, "html", "utf-8"))

            # Note: attachment and inline_images are not currently stored in the queue.
            # If needed in the future, extract them from history.meta.

            server.sendmail(SMTP_FROM_EMAIL, history.recipient_email, msg.as_string())
            server.quit()

            history.status = "sent"
            history.sent_at = datetime.now(timezone.utc)
            db.delete(item)
            db.flush()
            results.append(f"sent:{history.id}")

        except Exception as e:
            logger.error(f"Email send failed for {history.id}: {e}")
            history.status = "failed"
            history.error_message = str(e)[:1000]
            item.attempts += 1
            item.locked = False
            db.flush()
            results.append(f"failed:{history.id}")

    db.commit()
    return results


def retry_failed_emails(db: Session, limit: int = 20) -> List[str]:
    failed = (
        db.query(EmailQueue)
        .join(EmailHistory)
        .filter(
            EmailHistory.status == "failed",
            EmailQueue.attempts < EmailQueue.max_attempts,
            EmailQueue.locked == False,
        )
        .order_by(EmailQueue.scheduled_at.asc())
        .limit(limit)
        .all()
    )

    results = []
    for item in failed:
        item.scheduled_at = datetime.now(timezone.utc)
        item.attempts = 0
        db.flush()
        results.append(str(item.history_id))

    db.commit()
    return results


def get_email_history(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    recipient: Optional[str] = None,
    template_code: Optional[str] = None,
) -> tuple[List[EmailHistory], int]:
    query = db.query(EmailHistory)
    if status:
        query = query.filter(EmailHistory.status == status)
    if recipient:
        query = query.filter(EmailHistory.recipient_email.ilike(f"%{recipient}%"))
    if template_code:
        query = query.filter(EmailHistory.template_code == template_code)
    total = query.count()
    items = (
        query.order_by(EmailHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def get_email_stats(db: Session) -> Dict[str, int]:
    total = db.query(EmailHistory).count()
    sent = db.query(EmailHistory).filter(EmailHistory.status == "sent").count()
    failed = db.query(EmailHistory).filter(EmailHistory.status == "failed").count()
    queued = db.query(EmailHistory).filter(EmailHistory.status == "queued").count()
    pending_queue = db.query(EmailQueue).filter(EmailQueue.locked == False).count()
    return {
        "total": total,
        "sent": sent,
        "failed": failed,
        "queued": queued,
        "pending_in_queue": pending_queue,
    }
