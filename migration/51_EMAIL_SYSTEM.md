# Phase 11.1 — Email Notification System

## Overview
Complete email notification system with SMTP support, templates, queue management, and retry mechanisms.

## Components

### Email Service (`services/email_service.py`)
- SMTP connection management
- Email sending with TLS support
- Queue-based processing
- Retry mechanism for failed emails
- Attachment and inline image support

### Email Templates (`services/email_template_service.py`)
- 12 pre-built templates for all workflow events
- Variable interpolation with `{{variable}}` syntax
- Category-based organization
- Active/inactive toggle

### Email Triggers (`services/email_triggers.py`)
- Automatic email sending on workflow events
- Fallback HTML when templates fail
- In-app notification creation

## Templates

| Code | Category | Trigger |
|------|----------|---------|
| candidate_registered | candidate | Registration complete |
| interview_scheduled | interview | Interview scheduled |
| interview_reminder | reminder | 24h before interview |
| offer_generated | offer | Offer created |
| offer_accepted | offer | Offer accepted |
| offer_rejected | offer | Offer declined |
| joining_reminder | reminder | 7 days before joining |
| onboarding_started | onboarding | Onboarding initiated |
| document_pending | onboarding | Documents required |
| employee_activated | onboarding | Onboarding complete |
| hr_shortlist | workflow | HR shortlists candidate |
| CEO_review | workflow | CEO review required |

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/email/send` | `email.send` |
| POST | `/api/email/send-template` | `email.send` |
| POST | `/api/email/process-queue` | `email.admin` |
| POST | `/api/email/retry-failed` | `email.admin` |
| GET | `/api/email/history` | `email.view` |
| GET | `/api/email/stats` | `email.view` |
| GET | `/api/email/templates` | `email.view` |
| PUT | `/api/email/templates/{code}` | `email.admin` |
| POST | `/api/email/seed-templates` | `email.admin` |

## Environment Variables

```env
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_NAME=ATLAS HR System
SMTP_FROM_EMAIL=noreply@atlas.com
SMTP_USE_TLS=true
```

## Database Tables

### email_templates
- id, code, name, subject, body_html, body_text, category, is_active, variables, created_at, updated_at

### email_history
- id, template_code, recipient_email, recipient_name, subject, body_html, body_text, status, error_message, retry_count, max_retries, sent_at, created_at, metadata

### email_queue
- id, history_id, priority, scheduled_at, attempts, max_attempts, locked, locked_at, locked_by, created_at

## Status Flow
```
queued → processing → sent/failed
failed → retrying → sent/failed
```
