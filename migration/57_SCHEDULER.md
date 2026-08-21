# Phase 11.8 — Scheduler

## Overview
Background job scheduler for reminders, retries, and maintenance tasks.

## Components

### Scheduler Service (`services/scheduler_service.py`)
- Daily reminder checks
- Email queue processing
- Failed email retries
- Status monitoring

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/scheduler/run-daily` | `scheduler.admin` |
| GET | `/api/scheduler/status` | `scheduler.admin` |

## Scheduled Jobs

### Daily Checks
- Offer expiry reminders (3 days before expiry)
- Pending document reminders
- Upcoming interview reminders (24 hours)
- Joining reminders (7 days)

### Email Processing
- Process email queue (50 emails per run)
- Retry failed emails (20 per run)

### Maintenance
- Cleanup expired tokens
- Archive old activity logs
- compress old documents

## Status Response
```json
{
  "queue_pending": 5,
  "queue_locked": 0,
  "total_sent": 1234,
  "total_failed": 12,
  "last_run": "2026-07-14T00:00:00Z"
}
```

## Usage
The scheduler can be triggered:
1. Manually via API endpoint
2. Via cron job (external)
3. Via Docker Compose health check
