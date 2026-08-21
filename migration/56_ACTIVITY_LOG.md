# Phase 11.6 — Activity Logs

## Overview
Centralized audit trail tracking all system actions with searchable history.

## Components

### Activity Log Model (`models/communications.py`)
- User action tracking
- Entity-based logging (candidate, offer, onboarding, etc.)
- IP address and user agent capture
- JSONB details for rich metadata

### Activity Log Service (`services/activity_log_service.py`)
- Log any action with context
- Search by action, entity, user, date range
- Entity history tracking
- Action statistics

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/activity-logs` | `activity.view` |
| GET | `/api/activity-logs/entity/{type}/{id}` | `activity.view` |
| GET | `/api/activity-logs/user/{user_id}` | `activity.view` |
| GET | `/api/activity-logs/stats` | `activity.view` |

## Tracked Actions

### Authentication
- `user.login` - User login
- `user.logout` - User logout
- `user.login_failed` - Failed login attempt

### Candidate Actions
- `candidate.registered` - New candidate registered
- `candidate.forwarded` - Candidate forwarded to HR
- `candidate.shortlisted` - Candidate shortlisted by HR
- `candidate.rejected` - Candidate rejected

### Workflow Transitions
- `workflow.status_changed` - Status changed
- `workflow.interview_scheduled` - Interview scheduled
- `workflow.interview_completed` - Interview completed
- `workflow.evaluation_submitted` - Evaluation submitted

### Offer Management
- `offer.created` - Offer created
- `offer.sent` - Offer sent to candidate
- `offer.accepted` - Offer accepted
- `offer.declined` - Offer declined

### Onboarding
- `onboarding.started` - Onboarding initiated
- `onboarding.document_uploaded` - Document uploaded
- `onboarding.document_verified` - Document verified
- `onboarding.bgv_cleared` - Background check cleared
- `onboarding.asset_allocated` - Asset allocated
- `onboarding.completed` - Onboarding complete

### Documents
- `document.uploaded` - Document uploaded
- `document.downloaded` - Document downloaded
- `document.deleted` - Document deleted

### Administration
- `user.created` - User created
- `user.updated` - User updated
- `permission.changed` - Permission changed
