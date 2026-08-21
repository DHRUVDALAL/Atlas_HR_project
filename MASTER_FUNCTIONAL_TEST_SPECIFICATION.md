# MASTER FUNCTIONAL TEST SPECIFICATION

**Project:** ATLAS HR Recruitment Management System  
**Version:** 1.0.0  
**Date:** 2026-07-16  
**Classification:** CONFIDENTIAL — Internal QA Use Only  
**Prepared by:** Lead QA Architect & Lead Software Test Engineer  

---

## Document Control

| Field | Value |
|-------|-------|
| Document Owner | QA Lead |
| Review Cycle | Per Sprint |
| Automation Readiness | 85% |
| Total Test Cases | 487+ |
| Severity Levels | Critical / Major / Minor / Trivial |

---

# 1. PROJECT OVERVIEW

## 1.1 Purpose
ATLAS HR Recruitment System is an enterprise-grade applicant tracking and recruitment management platform. It manages the complete hiring lifecycle from candidate application through onboarding, with role-based access control, multi-stage interview workflows, offer management, and employee onboarding.

## 1.2 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend-NEW   │────▶│   FastAPI Backend  │────▶│  PostgreSQL DB   │
│  (TanStack Start │     │  (Python/FastAPI) │     │  (SQLAlchemy)    │
│   + shadcn/ui)   │     │                   │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                         │
        │                        │                         │
        ▼                        ▼                         ▼
  ┌──────────┐          ┌──────────────┐          ┌──────────────┐
  │ Frontend  │          │    Redis     │          │   Alembic    │
  │ (Legacy)  │          │  (Rate Limit)│          │ (Migrations) │
  └──────────┘          └──────────────┘          └──────────────┘
```

## 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend (New)** | React 19, TypeScript, TanStack Router/Start, shadcn/ui, Tailwind CSS, Vite |
| **Frontend (Legacy)** | React 18, JavaScript (JSX), Material UI, Vite |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2 |
| **Database** | PostgreSQL (production), SQLite (dev) |
| **Migrations** | Alembic |
| **Authentication** | JWT (Access + Refresh tokens), bcrypt password hashing |
| **Rate Limiting** | SlowAPI (Redis-backed) |
| **Email** | Async email queue with template engine |
| **File Storage** | Local filesystem (`/backend/uploads/`) |
| **Containerization** | Docker Compose (frontend, backend, PostgreSQL) |

## 1.4 Role Hierarchy

```
SYSTEM_ADMIN ──────── Full access to all modules
    │
CEO ───────────────── CEO evaluation, final decisions, offer approval
    │
HR_ADMIN ─────────── HR review, candidate management, offers, onboarding
    │
HR_PANEL ─────────── HR review (limited), candidate viewing
    │
TECH_HEAD ────────── Technical evaluation, final decisions, full visibility
    │
L2_PANEL ─────────── Technical evaluation, CEO evaluation, full visibility
    │
L1_PANEL ─────────── Technical evaluation (assigned only)
    │
RECEPTIONIST ─────── Candidate forwarding, basic viewing
```

---

# 2. SYSTEM MODULES

| # | Module | Description | Backend Routes | Frontend Pages |
|---|--------|-------------|----------------|----------------|
| 1 | Authentication | Login, logout, token refresh, current user | `/api/auth/*` | `/login` |
| 2 | Dashboard | Role-aware KPIs and queue widgets | `/api/dashboard-alerts`, `/api/reports/dashboard/summary` | `/dashboard` |
| 3 | Candidate Registration | Multi-step application form | `POST /api/applicant` | `/register-candidate` |
| 4 | Candidate Management | List, view, edit, delete candidates | `/api/applicants`, `/api/applicant/{id}` | `/candidates` |
| 5 | Reception Workflow | Forward/reject candidates | `POST /api/workflow/receptionist/forward/{id}`, `POST /api/workflow/receptionist/reject/{id}` | `/candidates` (action buttons) |
| 6 | HR Review | HR screening form, domain assignment, round config | `POST /api/workflow/hr/review/{id}` | `/hr/queue`, `/hr/review/$id` |
| 7 | Technical Evaluation | L1/L2/Tech Head scorecard evaluation | `POST /api/workflow/technical/evaluate/{id}/{round}` | `/interviewer/queue`, `/interviewer/evaluate/$id` |
| 8 | CEO Evaluation | CEO round review with draft/submit | `POST /api/workflow/ceo/evaluate/{id}` | `/ceo/queue`, `/ceo/evaluate/$id` |
| 9 | Final Discussion | HR/CEO discussion notes, final decision | `POST /api/workflow/final-decision/{id}`, `GET /api/workflow/final-discussion/{id}` | `/final-discussion/$id`, `/final-decision/$id` |
| 10 | Offer Management | Create, send, accept, decline offers | `/api/offers/*` | `/offer/dashboard`, `/offer/queue`, `/offer/$candidateId`, `/offer/builder/$candidateId`, `/offer/preview/$candidateId`, `/offer/status/$candidateId` |
| 11 | Onboarding | Employee onboarding lifecycle | `/api/onboarding/*` | `/onboarding/dashboard`, `/onboarding/queue`, `/onboarding/$candidateId` |
| 12 | Notifications | In-app notification system | `/api/notifications/*` | Notification bell component |
| 13 | Activity Logs | Audit trail for all actions | `/api/activity-logs/*` | Activity timeline on detail pages |
| 14 | Document Storage | File upload, download, versioning | `/api/documents/*` | Document tabs on detail pages |
| 15 | Search | Global search with saved searches | `/api/search/*` | Search inputs across pages |
| 16 | Reports | CSV export of candidates, offers, onboarding | `/api/reports/*` | Export buttons |
| 17 | Email Management | Email templates, queue, history | `/api/email/*` | ❌ Not Implemented (Backend only) |
| 18 | Background Verification | BGV status, provider verification | `/api/bgv/*` | Onboarding detail page |
| 19 | Scheduler | Daily reminders, scheduler status | `/api/scheduler/*` | ❌ Not Implemented (Backend only) |
| 20 | User Management | CRUD users, role assignment | `/api/users/*`, `/api/roles` | ❌ Not Implemented in new frontend |
| 21 | Scorecard | Domain-specific interview topics | `GET /api/scorecard/{domain}` | Interview evaluation form |
| 22 | Dashboard Alerts | Pending review, interviews today, etc. | `/api/dashboard-alerts` | Dashboard page |
| 23 | Candidate Portal | Public-facing application status | — | `/candidate-portal/$candidateId` |

---

# 3. USER ROLES & PERMISSIONS

## 3.1 Permission Catalog (42 permissions)

| Permission Code | Description |
|-----------------|-------------|
| `candidate.list` | Browse/search the candidate list |
| `candidate.read` | Read a candidate record |
| `candidate.update` | Edit a candidate record (pre-arrival statuses) |
| `candidate.update_any` | Edit a candidate record at any status |
| `candidate.delete` | Delete a candidate record |
| `workflow.reception_forward` | Forward a candidate from reception to HR |
| `workflow.hr_review` | Submit the HR review |
| `workflow.technical_evaluate` | Evaluate an assigned technical round |
| `workflow.ceo_evaluate` | Submit the CEO/final round |
| `decision.final` | Record the final hiring decision |
| `evaluation.view_all` | See every round, log and final decision |
| `evaluation.view_hr` | See HR rounds, logs and (if selected) the decision |
| `evaluation.view_assigned` | See only rounds you are assigned to |
| `user.manage` | Create/update/delete users |
| `role.read` | List roles |
| `offer.create` | Create offer for candidate |
| `offer.view` | View offer details |
| `offer.update` | Update offer details |
| `offer.send` | Send offer letter to candidate |
| `offer.approve` | Approve/accept offer |
| `offer.decline` | Decline offer |
| `offer.delete` | Delete an offer |
| `onboarding.manage` | Manage onboarding process |
| `onboarding.view` | View onboarding details |
| `onboarding.verify` | Verify documents and background checks |
| `onboarding.allocate` | Allocate IT assets |
| `email.send` | Send emails |
| `email.view` | View email history |
| `email.admin` | Administer email system |
| `notification.view` | View notifications |
| `notification.manage` | Manage notifications |
| `activity.view` | View activity logs |
| `document.upload` | Upload documents |
| `document.view` | View documents |
| `document.download` | Download documents |
| `document.delete` | Delete documents |
| `bgv.view` | View background verification |
| `bgv.verify` | Run background verification |
| `scheduler.admin` | Administer scheduler |
| `search.view` | Use search functionality |
| `report.export` | Export reports |
| `dashboard.view` | View dashboard alerts |

## 3.2 Role-Permission Matrix

| Permission | SYSTEM_ADMIN | HR_ADMIN | HR_PANEL | RECEPTIONIST | L1_PANEL | L2_PANEL | TECH_HEAD | CEO |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `candidate.list` | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `candidate.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `candidate.update` | ✅ | — | — | ✅ | — | — | — | — |
| `candidate.update_any` | ✅ | — | — | — | — | — | — | — |
| `candidate.delete` | ✅ | ✅ | — | — | — | — | — | — |
| `workflow.reception_forward` | ✅ | — | — | ✅ | — | — | — | — |
| `workflow.hr_review` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `workflow.technical_evaluate` | ✅ | — | — | — | ✅ | ✅ | ✅ | — |
| `workflow.ceo_evaluate` | ✅ | — | — | — | — | ✅ | — | ✅ |
| `decision.final` | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ |
| `evaluation.view_all` | ✅ | — | — | — | — | ✅ | ✅ | ✅ |
| `evaluation.view_hr` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `evaluation.view_assigned` | ✅ | — | — | — | ✅ | ✅ | ✅ | — |
| `user.manage` | ✅ | — | — | — | — | — | — | — |
| `role.read` | ✅ | ✅ | — | — | — | — | — | — |
| `offer.create` | ✅ | ✅ | — | — | — | — | — | — |
| `offer.view` | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `offer.update` | ✅ | ✅ | — | — | — | — | — | — |
| `offer.send` | ✅ | ✅ | — | — | — | — | — | — |
| `offer.approve` | ✅ | ✅ | — | — | — | — | — | ✅ |
| `offer.decline` | ✅ | ✅ | — | — | — | — | — | — |
| `offer.delete` | ✅ | ✅ | — | — | — | — | — | — |
| `onboarding.manage` | ✅ | ✅ | — | — | — | — | — | — |
| `onboarding.view` | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `onboarding.verify` | ✅ | ✅ | — | — | — | — | — | — |
| `onboarding.allocate` | ✅ | ✅ | — | — | — | — | — | — |
| `email.send` | ✅ | ✅ | — | — | — | — | — | — |
| `email.view` | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `email.admin` | ✅ | ✅ | — | — | — | — | — | — |
| `notification.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `notification.manage` | ✅ | ✅ | — | — | — | — | — | — |
| `activity.view` | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `document.upload` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `document.view` | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `document.download` | ✅ | ✅ | — | — | — | — | — | — |
| `document.delete` | ✅ | ✅ | — | — | — | — | — | — |
| `bgv.view` | ✅ | ✅ | — | — | — | — | — | — |
| `bgv.verify` | ✅ | ✅ | — | — | — | — | — | — |
| `scheduler.admin` | ✅ | ✅ | — | — | — | — | — | — |
| `search.view` | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `report.export` | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `dashboard.view` | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |

## 3.3 Role Access Summary

### SYSTEM_ADMIN
- **Allowed Pages:** All pages
- **Allowed APIs:** All endpoints
- **Buttons Visible:** All buttons
- **Workflow:** Can perform any action, bypasses assignment checks

### HR_ADMIN
- **Allowed Pages:** Dashboard, Candidates, HR Queue, HR Review, Offer Management, Onboarding, Reports
- **Allowed APIs:** candidate.*, workflow.hr_review, decision.final, offer.*, onboarding.*, email.*, search.*, reports.*
- **Buttons Visible:** Review, Forward, Reject, Create Offer, Send Offer, Accept/Decline Offer, Start Onboarding, Verify Documents, Allocate Assets

### RECEPTIONIST
- **Allowed Pages:** Dashboard, Candidates
- **Allowed APIs:** candidate.list, candidate.read, candidate.update, workflow.reception_forward
- **Buttons Visible:** Forward to HR, Reject at Reception
- **Forbidden Pages:** HR Queue, Interview Queue, CEO Queue, Offer, Onboarding

### L1_PANEL
- **Allowed Pages:** Dashboard, Interview Queue, Interview Evaluation
- **Allowed APIs:** candidate.read, workflow.technical_evaluate, my-assignments
- **Buttons Visible:** Submit Evaluation (for assigned rounds only)

### L2_PANEL
- **Allowed Pages:** Dashboard, Interview Queue, Interview Evaluation, CEO Queue, CEO Evaluation
- **Allowed APIs:** candidate.read, workflow.technical_evaluate, workflow.ceo_evaluate, evaluation.view_all
- **Buttons Visible:** Submit Evaluation, Submit CEO Evaluation

### TECH_HEAD
- **Allowed Pages:** Dashboard, Interview Queue, Interview Evaluation, CEO Queue, Offer, Onboarding
- **Allowed APIs:** candidate.read, workflow.technical_evaluate, evaluation.view_all, decision.final
- **Buttons Visible:** Submit Evaluation, View Offers, View Onboarding

### CEO
- **Allowed Pages:** Dashboard, Candidates, CEO Queue, CEO Evaluation, Final Discussion, Final Decision, Reports
- **Allowed APIs:** candidate.*, workflow.ceo_evaluate, decision.final, offer.view, offer.approve
- **Buttons Visible:** Submit CEO Evaluation, Record Final Decision, Approve Offer

---

# 4. COMPLETE PAGE INVENTORY

| # | Page Name | Route | APIs Used | Required Role/Permission | Status |
|---|-----------|-------|-----------|--------------------------|--------|
| 1 | Root Redirect | `/` | None | Public | ✅ Implemented |
| 2 | Login | `/login` | `POST /api/auth/login`, `GET /api/auth/me` | Public | ✅ Implemented |
| 3 | Register Candidate | `/register-candidate` | `POST /api/applicant` | Public | ✅ Implemented |
| 4 | Dashboard | `/dashboard` | `GET /api/applicants`, `GET /api/workflow/my-assignments`, `GET /api/offers/stats`, `GET /api/onboarding/stats` | Authenticated | ✅ Implemented |
| 5 | Candidates List | `/candidates` | `GET /api/applicants` | `candidate.list` | ✅ Implemented |
| 6 | HR Queue | `/hr/queue` | `GET /api/applicants` | `workflow.hr_review` | ✅ Implemented |
| 7 | HR Review Form | `/hr/review/$id` | `GET /api/applicants/{id}`, `POST /api/workflow/hr/review/{id}` | `workflow.hr_review` | ✅ Implemented |
| 8 | Interviewer Queue | `/interviewer/queue` | `GET /api/workflow/my-assignments` | `workflow.technical_evaluate` | ✅ Implemented |
| 9 | Technical Evaluation | `/interviewer/evaluate/$id` | `GET /api/applicants/{id}`, `GET /api/scorecard/{domain}`, `POST /api/workflow/technical/evaluate/{id}/{round}` | `workflow.technical_evaluate` | ✅ Implemented |
| 10 | CEO Queue | `/ceo/queue` | `GET /api/applicants` | `workflow.ceo_evaluate` | ✅ Implemented |
| 11 | CEO Evaluation | `/ceo/evaluate/$id` | `GET /api/applicants/{id}`, `POST /api/workflow/ceo/evaluate/{id}` | `workflow.ceo_evaluate` | ✅ Implemented |
| 12 | Final Discussion | `/final-discussion/$id` | `GET /api/workflow/final-discussion/{id}`, `POST /api/workflow/final-decision/{id}` | `decision.final` | ✅ Implemented |
| 13 | Final Decision | `/final-decision/$id` | `GET /api/workflow/final-discussion/{id}`, `POST /api/workflow/final-decision/{id}` | `decision.final` | ✅ Implemented |
| 14 | Offer Dashboard | `/offer/dashboard` | `GET /api/offers/stats`, `GET /api/offers` | `decision.final` | ✅ Implemented |
| 15 | Offer Queue | `/offer/queue` | `GET /api/offers` | `decision.final` | ✅ Implemented |
| 16 | Offer Detail | `/offer/$candidateId` | `GET /api/applicants/{id}`, `GET /api/offers/candidate/{id}` | `offer.view` | ✅ Implemented |
| 17 | Offer Builder | `/offer/builder/$candidateId` | `GET /api/applicants/{id}`, `GET /api/offers/candidate/{id}`, `POST /api/offers`, `PUT /api/offers/{id}`, `POST /api/offers/{id}/send` | `offer.create` | ✅ Implemented |
| 18 | Offer Preview | `/offer/preview/$candidateId` | `GET /api/applicants/{id}`, `GET /api/offers/candidate/{id}`, `POST /api/offers/{id}/send` | `offer.view` | ✅ Implemented |
| 19 | Offer Status | `/offer/status/$candidateId` | `GET /api/applicants/{id}`, `GET /api/offers/candidate/{id}` | `offer.view` | ✅ Implemented |
| 20 | Onboarding Dashboard | `/onboarding/dashboard` | `GET /api/onboarding/stats`, `GET /api/onboarding` | `decision.final` | ✅ Implemented |
| 21 | Onboarding Queue | `/onboarding/queue` | `GET /api/onboarding` | `onboarding.view` | ✅ Implemented |
| 22 | Onboarding Detail | `/onboarding/$candidateId` | `GET /api/applicants/{id}`, `GET /api/onboarding/candidate/{id}`, `POST /api/onboarding`, `POST /api/onboarding/{id}/documents/{type}/verify`, `POST /api/onboarding/{id}/documents/{type}/reject`, `POST /api/onboarding/{id}/bgv/{cat}/clear`, `POST /api/onboarding/{id}/bgv/{cat}/fail`, `POST /api/onboarding/{id}/assets/{type}/allocate`, `PUT /api/onboarding/{id}/checklist/{item}` | `onboarding.view` | ✅ Implemented |
| 23 | Candidate Portal | `/candidate-portal/$candidateId` | `GET /api/applicants/{id}`, `GET /api/offers/candidate/{id}` | Public | ✅ Implemented |

---

# 5. COMPLETE API INVENTORY

## 5.1 Authentication APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| POST | `/api/auth/login` | User login | No | None | `{email, password}` | `{success, token, refresh_token, role, message}` | 401, 429 |
| POST | `/api/auth/refresh` | Refresh access token | No | None | `{refresh_token}` | `{success, token, refresh_token}` | 401 |
| POST | `/api/auth/logout` | Revoke refresh token | No | None | `{refresh_token}` | `{success, message}` | — |
| GET | `/api/auth/me` | Get current user info | Yes | None | — | `{success, user, permissions}` | 401 |

## 5.2 Candidate APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| POST | `/api/applicant` | Submit application (multipart) | No | None | `payload` (JSON) + `signature` (PDF file) | `{success, message, data}` | 422 |
| GET | `/api/applicants` | List candidates (paginated) | Yes | `candidate.list` | Query: skip, limit, status, statuses, gender, city, state, domain, search, sort_by, sort_order | `{success, total, skip, limit, applicants}` | 403 |
| GET | `/api/applicant/{id}` | Get candidate detail | Yes | `candidate.read` | — | `{success, data}` | 403, 404 |
| PUT | `/api/applicant/{id}` | Update candidate | Yes | `candidate.update` or `candidate.update_any` | `{personal_details, professional_details, ...}` | `{success, message, data}` | 403, 404 |
| DELETE | `/api/applicant/{id}` | Delete candidate | Yes | `candidate.delete` | — | `{success, message}` | 403, 404 |

## 5.3 Workflow APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/workflow/my-assignments` | Interviewer's queue | Yes | `workflow.technical_evaluate` | Query: only_pending | `{success, assignments}` | — |
| POST | `/api/workflow/receptionist/forward/{candidate_id}` | Forward to HR | Yes | `workflow.reception_forward` | — | `{success, message, data}` | 400, 404 |
| POST | `/api/workflow/receptionist/reject/{candidate_id}` | Reject at reception | Yes | `workflow.reception_forward` | `{reason}` | `{success, message, data}` | 400, 404 |
| POST | `/api/workflow/hr/review/{candidate_id}` | Submit HR review | Yes | `workflow.hr_review` | `{domain, number_of_tech_rounds, hr_status, first_interviewer_email, evaluation_data}` | `{success, message, data}` | 400, 404 |
| POST | `/api/workflow/technical/evaluate/{candidate_id}/{round_number}` | Submit technical evaluation | Yes | `workflow.technical_evaluate` | `{status_selection, remarks, evaluation_data, next_interviewer_email}` | `{success, message, data}` | 400, 403, 404 |
| POST | `/api/workflow/ceo/evaluate/{candidate_id}` | Submit CEO evaluation | Yes | `workflow.ceo_evaluate` | `{remarks, evaluation_data, save_draft}` | `{success, message, data}` | 400, 404 |
| GET | `/api/workflow/final-discussion/{candidate_id}` | Get final discussion details | Yes | `decision.final` | — | `{success, candidate, technical_scores, ceo_scores, previous_evaluations}` | 404 |
| POST | `/api/workflow/final-decision/{candidate_id}` | Submit final decision | Yes | `decision.final` | `{final_status, offered_ctc, joining_date, final_remarks, hr_discussion_notes, hr_discussion, ceo_discussion, approved_by, save_draft}` | `{success, message, data}` | 400, 404 |

## 5.4 Offer APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/offers/stats` | Offer dashboard stats | Yes | `offer.view` | — | `{success, data}` | — |
| GET | `/api/offers` | List offers | Yes | `offer.view` | Query: skip, limit, status, search, sort_by, sort_order | `{success, total, data}` | — |
| GET | `/api/offers/{offer_id}` | Get offer details | Yes | `offer.view` | — | `{success, data}` | 404 |
| GET | `/api/offers/candidate/{candidate_id}` | Get offer by candidate | Yes | `offer.view` | — | `{success, data}` | 404 |
| POST | `/api/offers` | Create offer | Yes | `offer.create` | `{candidate_id, offered_ctc, joining_date, notes}` | `{success, message, data}` | 400 |
| PUT | `/api/offers/{offer_id}` | Update offer | Yes | `offer.update` | `{offered_ctc, joining_date, notes}` | `{success, message, data}` | 400, 404 |
| POST | `/api/offers/{offer_id}/send` | Send offer | Yes | `offer.send` | — | `{success, message, data}` | 400, 404 |
| POST | `/api/offers/{offer_id}/accept` | Accept offer | Yes | `offer.approve` | — | `{success, message, data}` | 400, 404 |
| POST | `/api/offers/{offer_id}/decline` | Decline offer | Yes | `offer.decline` | — | `{success, message, data}` | 400, 404 |
| DELETE | `/api/offers/{offer_id}` | Delete offer | Yes | `offer.delete` | — | `{success, message}` | 404 |
| GET | `/api/offers/{offer_id}/history` | Get offer history | Yes | `offer.view` | — | `{success, data}` | 404 |
| GET | `/api/offers/{offer_id}/documents` | Get offer documents | Yes | `offer.view` | — | `{success, data}` | 404 |

## 5.5 Onboarding APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/onboarding/stats` | Onboarding dashboard stats | Yes | `onboarding.view` | — | `{success, data}` | — |
| GET | `/api/onboarding` | List onboarding records | Yes | `onboarding.view` | Query: skip, limit, status, search, sort_by, sort_order | `{success, total, data}` | — |
| GET | `/api/onboarding/{onboarding_id}` | Get onboarding details | Yes | `onboarding.view` | — | `{success, data}` | 404 |
| GET | `/api/onboarding/candidate/{candidate_id}` | Get onboarding by candidate | Yes | `onboarding.view` | — | `{success, data}` | 404 |
| POST | `/api/onboarding` | Start onboarding | Yes | `onboarding.manage` | `{candidate_id}` | `{success, message, data}` | 400 |
| PUT | `/api/onboarding/{onboarding_id}` | Update onboarding status | Yes | `onboarding.manage` | `{status}` | `{success, message, data}` | 400, 404 |
| GET | `/api/onboarding/{onboarding_id}/checklist` | Get checklist | Yes | `onboarding.view` | — | `{success, data}` | 404 |
| PUT | `/api/onboarding/{onboarding_id}/checklist/{item_name}` | Update checklist item | Yes | `onboarding.manage` | `{is_completed}` | `{success, message, data}` | 400, 404 |
| POST | `/api/onboarding/{onboarding_id}/documents/{doc_type}/verify` | Verify document | Yes | `onboarding.verify` | `{notes}` | `{success, message, data}` | 404 |
| POST | `/api/onboarding/{onboarding_id}/documents/{doc_type}/reject` | Reject document | Yes | `onboarding.verify` | `{notes}` | `{success, message, data}` | 404 |
| POST | `/api/onboarding/{onboarding_id}/bgv/{category}/clear` | Clear background check | Yes | `onboarding.verify` | `{notes}` | `{success, message, data}` | 404 |
| POST | `/api/onboarding/{onboarding_id}/bgv/{category}/fail` | Fail background check | Yes | `onboarding.verify` | `{notes}` | `{success, message, data}` | 404 |
| POST | `/api/onboarding/{onboarding_id}/assets/{asset_type}/allocate` | Allocate IT asset | Yes | `onboarding.allocate` | `{asset_id, notes}` | `{success, message, data}` | 404 |
| GET | `/api/onboarding/{onboarding_id}/assets` | Get allocated assets | Yes | `onboarding.view` | — | `{success, data}` | 404 |

## 5.6 Notification APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/notifications` | List notifications | Yes | `notification.view` | Query: skip, limit, is_read, category, type | `{items, total, unread_count, skip, limit}` | — |
| GET | `/api/notifications/unread-count` | Get unread count | Yes | `notification.view` | — | `{count}` | — |
| PUT | `/api/notifications/{notification_id}/read` | Mark as read | Yes | `notification.view` | — | `{success}` | — |
| PUT | `/api/notifications/read-all` | Mark all as read | Yes | `notification.view` | — | `{marked_read}` | — |
| DELETE | `/api/notifications/{notification_id}` | Delete notification | Yes | `notification.view` | — | `{deleted}` | — |

## 5.7 Activity Log APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/activity-logs` | List activity logs | Yes | `activity.view` | Query: skip, limit, action, entity_type, entity_id, user_id, start_date, end_date, search | `{items, total, skip, limit}` | — |
| GET | `/api/activity-logs/entity/{entity_type}/{entity_id}` | Entity history | Yes | `activity.view` | — | `{items, total}` | — |
| GET | `/api/activity-logs/user/{user_id}` | User activity | Yes | `activity.view` | — | `{items, total}` | — |
| GET | `/api/activity-logs/stats` | Activity stats | Yes | `activity.view` | Query: days | Stats object | — |

## 5.8 Document Storage APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| POST | `/api/documents/upload/{candidate_id}` | Upload document | Yes | `document.upload` | FormData: document_type, file | Upload result | — |
| GET | `/api/documents/candidate/{candidate_id}` | List candidate documents | Yes | `document.view` | Query: document_type, include_all_versions | `{items, total}` | — |
| GET | `/api/documents/candidate/{candidate_id}/summary` | Document summary | Yes | `document.view` | — | Summary object | — |
| GET | `/api/documents/{document_id}` | Get document | Yes | `document.view` | — | Document metadata | — |
| GET | `/api/documents/{document_id}/download` | Download document | Yes | `document.download` | — | File response | — |
| GET | `/api/documents/candidate/{candidate_id}/versions/{document_type}` | Get versions | Yes | `document.view` | — | `{items, total}` | — |
| DELETE | `/api/documents/{document_id}` | Delete document | Yes | `document.delete` | — | `{deleted}` | — |
| GET | `/api/documents/stats/storage` | Storage stats | Yes | `document.view` | — | Stats object | — |

## 5.9 Search APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/search` | Global search | Yes | `search.view` | Query: q, type, skip, limit | Search results | — |
| POST | `/api/search/saved` | Save search | Yes | `search.view` | Query: name, search_type, filters, is_public | Saved search object | — |
| GET | `/api/search/saved` | List saved searches | Yes | `search.view` | — | `{items, total}` | — |
| DELETE | `/api/search/saved/{search_id}` | Delete saved search | Yes | `search.view` | — | `{deleted}` | — |

## 5.10 Report APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/reports/candidates/export` | Export candidates CSV | Yes | `report.export` | Query: format, status | CSV file download | — |
| GET | `/api/reports/offers/export` | Export offers CSV | Yes | `report.export` | Query: format, status | CSV file download | — |
| GET | `/api/reports/onboarding/export` | Export onboarding CSV | Yes | `report.export` | Query: format, status | CSV file download | — |
| GET | `/api/reports/dashboard/summary` | Dashboard summary | Yes | `dashboard.view` | — | Summary stats | — |

## 5.11 Email APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| POST | `/api/email/send` | Send email | Yes | `email.send` | `{to_email, subject, body_html, ...}` | EmailHistory object | — |
| POST | `/api/email/send-template` | Send template email | Yes | `email.send` | `{to_email, template_code, variables, ...}` | EmailHistory object | — |
| POST | `/api/email/process-queue` | Process email queue | Yes | `email.admin` | Query: limit | `{processed, results}` | — |
| POST | `/api/email/retry-failed` | Retry failed emails | Yes | `email.admin` | Query: limit | `{retried, ids}` | — |
| GET | `/api/email/history` | Email history | Yes | `email.view` | Query: skip, limit, status, recipient, template_code | `{items, total}` | — |
| GET | `/api/email/stats` | Email stats | Yes | `email.view` | — | Stats object | — |
| GET | `/api/email/templates` | List templates | Yes | `email.view` | Query: category | Templates list | — |
| PUT | `/api/email/templates/{code}` | Update template | Yes | `email.admin` | `{subject, body_html, body_text, is_active, variables}` | Template object | — |
| POST | `/api/email/seed-templates` | Seed templates | Yes | `email.admin` | — | `{seeded}` | — |

## 5.12 BGV APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/bgv/onboarding/{onboarding_id}` | Get BGV for onboarding | Yes | `onboarding.view` | — | `{items, total}` | — |
| POST | `/api/bgv/verify/{bgv_id}` | Verify single BGV | Yes | `onboarding.verify` | Query: category, provider_name, body: data | Verification result | — |
| GET | `/api/bgv/providers` | List BGV providers | Yes | `onboarding.view` | — | `{providers}` | — |

## 5.13 Scheduler APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| POST | `/api/scheduler/run-daily` | Run daily reminders | Yes | `scheduler.admin` | — | Results object | — |
| GET | `/api/scheduler/status` | Scheduler status | Yes | `scheduler.admin` | — | Status object | — |

## 5.14 User Management APIs

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/roles` | List roles | Yes | `role.read` | — | Roles list | — |
| POST | `/api/users` | Create user | Yes | `user.manage` | `{employee_code, first_name, last_name, email, password, role_id, ...}` | User object | 400, 404 |
| GET | `/api/users` | List users | Yes | `user.manage` | Query: role_id, skip, limit | Users list | — |
| GET | `/api/users/{user_id}` | Get user | Yes | `user.manage` | — | User object | 404 |
| PUT | `/api/users/{user_id}` | Update user | Yes | `user.manage` | `{first_name, last_name, email, role_id, ...}` | User object | 400, 404 |
| DELETE | `/api/users/{user_id}` | Delete user | Yes | `user.manage` | — | 204 | 400, 404 |

## 5.15 Dashboard Alerts API

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/api/dashboard-alerts` | Get dashboard alerts | Yes | `dashboard.view` | — | `{pending_review, interviews_today, interviews_this_week, offers_pending, ...}` | — |

## 5.16 Health Check

| Method | URL | Purpose | Auth Required | Permission | Request Body | Response | Error Codes |
|--------|-----|---------|:---:|-----------|-------------|----------|-------------|
| GET | `/health` | Health check | No | None | — | `{status, timestamp, version, services}` | 503 |

---

# 6. DATABASE COLLECTION CHECKLIST

## 6.1 Core Entities

### candidates (Applicant)
| Column | Type | Description |
|--------|------|-------------|
| candidate_id | UUID (PK) | Unique identifier |
| application_number | String(30) | Auto-generated application number |
| first_name, middle_name, last_name | String | Personal name |
| email | String(254) | Unique email |
| phone, alternate_phone | String(15) | Contact numbers |
| gender | String(10) | MALE, FEMALE, OTHER |
| date_of_birth | Date | DOB |
| current_address, permanent_address | Text | Addresses |
| city, state, country, pincode | String | Location |
| status | String(50) | Current workflow status |
| domain | String(100) | Technical domain |
| total_rounds | Integer | Configured tech rounds |
| position_applied_for | String(100) | Job position |
| referred_by, reference_number | String | Referral info |
| created_at, updated_at | DateTime | Timestamps |

**Workflow Impact:** Status field drives entire workflow. Updated on every transition.

### applicant_professional_details
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| candidate_id | UUID (FK) | One-to-one with candidates |
| current_company, current_designation | String | Current employment |
| total_experience, relevant_experience | Numeric(4,1) | Years of experience |
| current_ctc, expected_ctc | Numeric(12,2) | Compensation |
| notice_period, joining_availability | String | Availability |
| preferred_location | String | Location preference |
| employment_type | String(20) | FULL_TIME, PART_TIME, CONTRACT, INTERN |

### applicant_employment_history
- One-to-many with candidates
- Fields: company_name, designation, start_date, end_date, responsibilities, reason_for_leaving

### applicant_education
- One-to-many with candidates
- Fields: qualification, institution_name, university, passing_year, percentage, grade, specialization

### applicant_personality_assessment
- One-to-many with candidates (unique constraint on candidate_id + question_number)
- Fields: question_number, rating (1-5)

### applicant_situational_responses
- One-to-many with candidates (unique constraint on candidate_id + question_number)
- Fields: question_number, selected_option (A/B/C/D)

### applicant_written_responses
- One-to-many with candidates (unique constraint on candidate_id + question_number)
- Fields: question_number, answer_text

### applicant_declaration
- One-to-one with candidates
- Fields: declaration_accepted, consent_accepted, signed_date

### candidate_documents
- One-to-many with candidates
- Fields: document_id, document_type (SIGNATURE_PDF), file_name, file_path, uploaded_at

### interview_panel_assessment
- One-to-many with candidates
- Fields: panel_member_name, panel_role, technical_rating (1-5), communication_rating (1-5), overall_rating (1-5), recommendation (HIRE/REJECT/HOLD), comments

### interview_rounds
- One-to-many with candidates
- Fields: round_id, round_number, round_type (HR_REVIEW/TECHNICAL/CEO_ROUND), assigned_interviewer, next_interviewer_email, status (PENDING/COMPLETED/REJECTED/HOLD), remarks, evaluation_data (JSONB)

### final_decisions
- One-to-one with candidates
- Fields: decision_id, final_status (SELECTED/REJECTED/HOLD), offered_ctc, joining_date, approved_by, final_remarks, hr_discussion_notes, hr_discussion, ceo_discussion, decision_date, created_by

### candidate_assignments
- One-to-many with candidates
- Fields: assignment_id, assigned_to, assigned_by, status (ACTIVE/COMPLETED/OVERRIDDEN)

### candidate_activity_logs
- One-to-many with candidates
- Fields: log_id, action, performed_by, details, timestamp

### users
- Fields: user_id, role_id (FK), employee_code, first_name, last_name, email, mobile_no, password, department, is_active, last_login, failed_login_attempts, locked_until

### roles
- Fields: role_id, role_name (unique)
- Many-to-many with permissions

### permissions
- Fields: permission_id, code (unique), description
- Many-to-many with roles

### role_permissions (junction)
- Fields: role_id (FK), permission_id (FK)

### refresh_tokens
- Fields: token_id, user_id (FK), token_hash, expires_at, is_revoked, created_at, revoked_at

### offers
- Fields: offer_id, candidate_id (FK, unique), status (DRAFT/SENT/ACCEPTED/DECLINED), offered_ctc, joining_date, approved_by, sent_at, responded_at, notes, created_by

### offer_documents
- Fields: document_id, offer_id (FK), document_type (OFFER_LETTER/SIGNED_OFFER/ADDENDUM/OTHER), file_name, file_path, uploaded_by

### offer_history
- Fields: history_id, offer_id (FK), action, performed_by, details

### onboarding
- Fields: onboarding_id, candidate_id (FK, unique), status (PENDING/IN_PROGRESS/COMPLETED), started_at, completed_at, created_by

### document_verification
- Fields: verification_id, onboarding_id (FK), document_type (AADHAAR/PAN/PASSPORT/DL/EDUCATION/EXPERIENCE/RESUME/OFFER_LETTER), status (PENDING/VERIFIED/REJECTED), verified_by, notes

### background_verification
- Fields: bgv_id, onboarding_id (FK), category (REFERENCE/EMPLOYMENT/EDUCATION/CRIMINAL), status (PENDING/CLEARED/FAILED), verified_by, notes

### asset_allocation
- Fields: allocation_id, onboarding_id (FK), asset_type (LAPTOP/MONITOR/PHONE/EMAIL/ACCESS_CARD/VPN/SOFTWARE_LICENSES), status (PENDING/ALLOCATED/CONFIGURED/RETURNED), asset_id, allocated_by

### employee_checklist
- Fields: checklist_id, onboarding_id (FK), item_name (8 predefined items), is_completed, completed_by

### onboarding_activity
- Fields: activity_id, onboarding_id (FK), action, performed_by, details

### notifications
- Fields: id, user_id (FK), title, message, type, category, priority, is_read, read_at, action_url, meta (JSONB)

### activity_logs
- Fields: id, user_id (FK), user_email, action, entity_type, entity_id, entity_label, details (JSONB), ip_address, user_agent

### document_storage
- Fields: id, candidate_id (FK), uploaded_by (FK), document_type, file_name, original_name, mime_type, file_size, file_path, version, is_latest, meta (JSONB), checksum

### saved_searches
- Fields: id, user_id (FK), name, search_type, filters (JSONB), is_public, use_count

### email_templates
- Fields: id, code (unique), name, subject, body_html, body_text, category, is_active, variables (JSONB)

### email_history
- Fields: id, template_code, recipient_email, subject, body_html, status (pending/sent/failed), error_message, retry_count, sent_at, meta (JSONB)

### email_queue
- Fields: id, history_id (FK), priority, scheduled_at, attempts, max_attempts, locked

---

# 7. COMPLETE WORKFLOW

## 7.1 End-to-End Recruitment Workflow

```
Candidate Registration (POST /api/applicant)
    │
    ▼
Status: SUBMITTED → "Submitted — awaiting reception"
    │
    ▼
Receptionist Forward (POST /api/workflow/receptionist/forward/{id})
    │ Status → RECEPTION_FORWARDED
    │ Activity Log: "Candidate Checked In", "Candidate Status Changed"
    │ Notification → HR_ADMIN: "Candidate Ready for HR Review"
    │
    ▼
HR Review (POST /api/workflow/hr/review/{id})
    │
    ├── HR Status = REJECT → Status: REJECTED (STOP)
    │   Activity Log: "HR Submitted Review", "Candidate Status Changed"
    │
    ├── HR Status = HOLD → Status: ON_HOLD (STOP)
    │   Activity Log: "HR Submitted Review", "Candidate Status Changed"
    │
    └── HR Status = SELECT → Status: TECH_ROUND_1
        │ Activity Log: "HR Submitted Review", "Candidate Status Changed"
        │ Creates: InterviewRound (round 1, TECHNICAL, PENDING)
        │ Creates: CandidateAssignment
        │
        ▼
    Technical Round N (POST /api/workflow/technical/evaluate/{id}/{round})
        │
        ├── Status = REJECTED → Status: REJECTED (STOP)
        │   Activity Log: "Technical Round Submitted", "Candidate Status Changed"
        │
        ├── Status = HOLD → Status: ON_HOLD (STOP)
        │   Activity Log: "Technical Round Submitted", "Candidate Status Changed"
        │
        └── Status = COMPLETED
            │
            ├── Round N < Total Rounds → Forward to Round N+1
            │   Status: TECH_ROUND_{N+1}
            │   Creates: InterviewRound (round N+1, TECHNICAL, PENDING)
            │   Creates: CandidateAssignment
            │
            └── Round N = Total Rounds → Forward to CEO
                Status: CEO_ROUND
                Creates: InterviewRound (CEO_ROUND, PENDING)
                Creates: CandidateAssignment
                │
                ▼
            CEO Evaluation (POST /api/workflow/ceo/evaluate/{id})
                │
                ├── save_draft = true → Status: CEO_ROUND (UNDER_REVIEW on round)
                │   Activity Log: "CEO Saved Review Draft"
                │
                └── save_draft = false → Status: FINAL_DISCUSSION_PENDING
                    Activity Log: "CEO Scorecard Submitted", "Candidate Status Changed"
                    │
                    ▼
                Final Decision (POST /api/workflow/final-decision/{id})
                    │
                    ├── save_draft = true → Status: FINAL_DISCUSSION_PENDING (no change)
                    │   Activity Log: "Final Decision Draft Saved"
                    │
                    └── save_draft = false
                        │
                        ├── final_status = SELECTED → Status: SELECTED
                        │   Required: offered_ctc > 0, joining_date
                        │   Activity Log: "Final Decision Submitted", "Candidate Selected"
                        │
                        ├── final_status = REJECTED → Status: REJECTED
                        │   Activity Log: "Final Decision Submitted", "Candidate Rejected"
                        │
                        └── final_status = HOLD → Status: ON_HOLD
                            Activity Log: "Final Decision Submitted", "Candidate Hold"
                            │
                            ▼
                        Offer Management (POST /api/offers)
                            │
                            ├── Create (DRAFT) → POST /api/offers
                            ├── Send (DRAFT → SENT) → POST /api/offers/{id}/send
                            ├── Accept (SENT → ACCEPTED) → POST /api/offers/{id}/accept
                            └── Decline (SENT → DECLINED) → POST /api/offers/{id}/decline
                                │
                                ▼ (if ACCEPTED)
                            Onboarding (POST /api/onboarding)
                                │
                                ├── Start (PENDING)
                                ├── In Progress (IN_PROGRESS)
                                │   ├── Verify Documents
                                │   ├── Background Verification
                                │   ├── Allocate IT Assets
                                │   └── Complete Checklist Items
                                └── Complete (COMPLETED)
```

## 7.2 Workflow Transition Table

| Current Status | Next Status | Action | API Endpoint | Responsible Role | Notifications |
|---------------|-------------|--------|--------------|------------------|---------------|
| SUBMITTED | RECEPTION_FORWARDED | Forward | `POST /api/workflow/receptionist/forward/{id}` | RECEPTIONIST | → HR_ADMIN |
| SUBMITTED | REJECTED | Reject | `POST /api/workflow/receptionist/reject/{id}` | RECEPTIONIST | — |
| RECEPTION_FORWARDED | TECH_ROUND_1 | HR Review (SELECT) | `POST /api/workflow/hr/review/{id}` | HR_ADMIN | → L1_PANEL |
| RECEPTION_FORWARDED | REJECTED | HR Review (REJECT) | `POST /api/workflow/hr/review/{id}` | HR_ADMIN | — |
| RECEPTION_FORWARDED | ON_HOLD | HR Review (HOLD) | `POST /api/workflow/hr/review/{id}` | HR_ADMIN | — |
| TECH_ROUND_N | TECH_ROUND_{N+1} | Technical (COMPLETED) | `POST /api/workflow/technical/evaluate/{id}/{round}` | L1/L2/TECH_HEAD | → Next Interviewer |
| TECH_ROUND_N | CEO_ROUND | Technical (COMPLETED, last round) | `POST /api/workflow/technical/evaluate/{id}/{round}` | L1/L2/TECH_HEAD | → CEO |
| TECH_ROUND_N | REJECTED | Technical (REJECTED) | `POST /api/workflow/technical/evaluate/{id}/{round}` | L1/L2/TECH_HEAD | — |
| TECH_ROUND_N | ON_HOLD | Technical (HOLD) | `POST /api/workflow/technical/evaluate/{id}/{round}` | L1/L2/TECH_HEAD | — |
| CEO_ROUND | FINAL_DISCUSSION_PENDING | CEO Submit | `POST /api/workflow/ceo/evaluate/{id}` | CEO | — |
| FINAL_DISCUSSION_PENDING | SELECTED | Final Decision | `POST /api/workflow/final-decision/{id}` | HR_ADMIN, CEO, SYSTEM_ADMIN | — |
| FINAL_DISCUSSION_PENDING | REJECTED | Final Decision | `POST /api/workflow/final-decision/{id}` | HR_ADMIN, CEO, SYSTEM_ADMIN | — |
| FINAL_DISCUSSION_PENDING | ON_HOLD | Final Decision | `POST /api/workflow/final-decision/{id}` | HR_ADMIN, CEO, SYSTEM_ADMIN | — |
| SELECTED | Offer DRAFT | Create Offer | `POST /api/offers` | HR_ADMIN | — |
| Offer DRAFT | Offer SENT | Send Offer | `POST /api/offers/{id}/send` | HR_ADMIN | — |
| Offer SENT | Offer ACCEPTED | Accept Offer | `POST /api/offers/{id}/accept` | HR_ADMIN, CEO | — |
| Offer SENT | Offer DECLINED | Decline Offer | `POST /api/offers/{id}/decline` | HR_ADMIN | — |
| OFFER_ACCEPTED | PENDING | Start Onboarding | `POST /api/onboarding` | HR_ADMIN | — |
| PENDING | IN_PROGRESS | Update Status | `PUT /api/onboarding/{id}` | HR_ADMIN | — |
| IN_PROGRESS | COMPLETED | Update Status | `PUT /api/onboarding/{id}` | HR_ADMIN | — |

---

# 8. SCREEN-BY-SCREEN TEST CASES

## 8.1 Login Page (`/login`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| LOGIN-001 | Page Load | Navigate to `/login` | Login form with email and password fields visible | Critical |
| LOGIN-002 | Valid Login | Enter valid admin email + password, click Sign In | Redirects to `/dashboard`, user greeting shown | Critical |
| LOGIN-003 | Invalid Email | Enter non-existent email, click Sign In | Error toast "Invalid email or password" | Critical |
| LOGIN-004 | Invalid Password | Enter valid email + wrong password, click Sign In | Error toast "Invalid email or password" | Critical |
| LOGIN-005 | Empty Fields | Click Sign In with empty email and password | Validation errors shown | Major |
| LOGIN-006 | Rate Limiting | Attempt 6+ logins within 1 minute | 429 Too Many Requests | Major |
| LOGIN-007 | Role-based Welcome | Login as each role (ADMIN, HR, RECEPTIONIST, L1, L2, TECH_HEAD) | Correct welcome message displayed | Major |
| LOGIN-008 | Already Authenticated | Navigate to `/login` while authenticated | Redirect to `/dashboard` | Minor |
| LOGIN-009 | Token Storage | After login, inspect localStorage | `atlas.access_token` and `atlas.refresh_token` stored | Critical |
| LOGIN-010 | Logout | Click Sign out button | Tokens cleared, redirect to `/login` | Critical |

## 8.2 Dashboard Page (`/dashboard`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| DASH-001 | Page Load | Login as any role, navigate to `/dashboard` | Dashboard loads with role-appropriate widgets | Critical |
| DASH-002 | KPI Cards | Login as HR_ADMIN | KPI cards show total candidates, pending reviews, etc. | Major |
| DASH-003 | Reception View | Login as RECEPTIONIST | Shows pending candidates for check-in | Major |
| DASH-004 | Interviewer View | Login as L1_PANEL | Shows pending interview assignments | Major |
| DASH-005 | CEO View | Login as CEO | Shows CEO review queue and final decisions | Major |
| DASH-006 | Quick Actions | Click action buttons on dashboard | Navigate to correct pages | Major |
| DASH-007 | Notification Bell | Click notification bell | Shows notification dropdown | Minor |
| DASH-008 | Loading State | Refresh page | Loading spinner shown until data loads | Minor |
| DASH-009 | Role Protection | Access `/dashboard` without login | Redirect to `/login` | Critical |

## 8.3 Register Candidate Page (`/register-candidate`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| REG-001 | Step Navigation | Click through all 8 steps | Step indicator updates, progress bar fills | Critical |
| REG-002 | Personal Details | Fill all required fields (first_name, last_name, email, phone, gender, DOB, address, city, state, country, pincode, position) | Validation passes | Critical |
| REG-003 | Email Validation | Enter invalid email format | "Invalid email address format" error | Critical |
| REG-004 | Phone Validation | Enter phone with non-10 digits | "Phone number must be exactly 10 digits" error | Critical |
| REG-005 | DOB Validation | Enter future date for DOB | "Date of birth cannot be a future date" error | Critical |
| REG-006 | Professional Details | Fill experience, CTC, employment type | Validation passes | Critical |
| REG-007 | Employment History | Add/remove employment rows | Rows add/remove correctly | Major |
| REG-008 | Education | Add/remove education rows | Rows add/remove correctly | Major |
| REG-009 | Personality Assessment | Rate all 18 statements (1-5) | All must be rated before proceeding | Critical |
| REG-010 | Situational Responses | Select option A/B/C/D for all 5 scenarios | All must be answered | Critical |
| REG-011 | Written Responses | Type answers for all 5 questions (min 20 chars) | All must meet minimum length | Critical |
| REG-012 | Declaration | Check both declaration and consent checkboxes | Both must be checked | Critical |
| REG-013 | Signature Upload | Upload a PDF file as signature | File accepted, shown in form | Critical |
| REG-014 | Submit Application | Complete all steps, click Submit | Success page with application number shown | Critical |
| REG-015 | Draft Save | Fill partial form, navigate away | Draft saved to localStorage | Major |
| REG-016 | Draft Restore | Return to `/register-candidate` | Draft loaded from localStorage | Major |
| REG-017 | Edit Mode | Navigate to `/register-candidate?edit={id}` | Form pre-populated with existing data | Major |
| REG-018 | Read-only Mode | Edit a candidate past pre-arrival status | Form becomes read-only with warning | Major |
| REG-019 | Step Jump | Click on step 5 while on step 1 | Validates intermediate steps before allowing jump | Minor |
| REG-020 | API Error | Backend returns error during submit | Error toast shown, form remains intact | Major |

## 8.4 Candidates List Page (`/candidates`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| CAND-001 | Page Load | Navigate to `/candidates` | Paginated candidate list shown | Critical |
| CAND-002 | Pagination | Click next/prev page buttons | Correct page of candidates loaded | Major |
| CAND-003 | Search | Type in search box | Candidates filtered by name/email/phone | Major |
| CAND-004 | Status Filter | Select status filter dropdown | Only candidates with selected status shown | Major |
| CAND-005 | Sort | Change sort field/order | List re-sorted accordingly | Major |
| CAND-006 | Action Buttons | View action buttons per candidate | Buttons match candidate status (Review, Evaluate, etc.) | Critical |
| CAND-007 | Role Protection | Login as RECEPTIONIST | Cannot see HR Review or Technical Evaluation buttons | Critical |
| CAND-008 | Empty State | Search for non-existent candidate | "No results found" message shown | Minor |
| CAND-009 | Candidate Detail | Click on candidate name/card | Navigates to appropriate detail/form page | Critical |
| CAND-010 | Loading State | Page loads | Skeleton/loading spinner shown | Minor |

## 8.5 HR Queue Page (`/hr/queue`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| HRQ-001 | Page Load | Login as HR_ADMIN, navigate to `/hr/queue` | HR queue with KPI cards and candidate list | Critical |
| HRQ-002 | KPI Cards | View KPI section | Shows: Awaiting HR, HR Completed, In Technical, Selected | Major |
| HRQ-003 | Status Filter | Filter by RECEPTION_FORWARDED | Only candidates awaiting HR review shown | Major |
| HRQ-004 | Review Button | Click "Review" on a RECEPTION_FORWARDED candidate | Navigate to `/hr/review/{id}` | Critical |
| HRQ-005 | Role Protection | Login as RECEPTIONIST | 403 or redirect (no access to HR queue) | Critical |

## 8.6 HR Review Form (`/hr/review/$id`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| HRREV-001 | Page Load | Navigate to `/hr/review/{id}` | Candidate details loaded, form displayed | Critical |
| HRREV-002 | Candidate Summary | View candidate card | Shows name, email, phone, position, status | Major |
| HRREV-003 | Domain Selection | Select a domain from dropdown | Domain value saved | Critical |
| HRREV-004 | Tech Rounds | Enter number of technical rounds (1-10) | Value saved, validated | Critical |
| HRREV-005 | HR Decision | Select SELECT/REJECT/HOLD | Decision value saved | Critical |
| HRREV-006 | First Interviewer | Enter valid interviewer email | Email validated | Critical |
| HRREV-007 | Scorecard | Rate behavioral topics 1-5 | All topics rated | Major |
| HRREV-008 | Submit (SELECT) | Fill all fields, select SELECT, submit | Candidate status → TECH_ROUND_1, round 1 created | Critical |
| HRREV-009 | Submit (REJECT) | Fill all fields, select REJECT, submit | Candidate status → REJECTED | Critical |
| HRREV-010 | Submit (HOLD) | Fill all fields, select HOLD, submit | Candidate status → ON_HOLD | Critical |
| HRREV-011 | Validation | Submit without required fields | Error toast with missing fields | Major |
| HRREV-012 | Wrong Status | Access form for candidate not in RECEPTION_FORWARDED | Error or redirect | Critical |
| HRREV-013 | Activity Log | After submit, check candidate activity logs | "HR Submitted Review" and "Candidate Status Changed" logged | Major |

## 8.7 Interviewer Queue (`/interviewer/queue`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| INTQ-001 | Page Load | Login as L1_PANEL, navigate to `/interviewer/queue` | Assignment queue shown | Critical |
| INTQ-002 | Pending Assignments | View list | Only PENDING rounds assigned to current user shown | Critical |
| INTQ-003 | Search | Search by candidate name | Filtered results shown | Minor |
| INTQ-004 | Evaluate Button | Click "Evaluate" on an assignment | Navigate to `/interviewer/evaluate/{candidateId}` | Critical |
| INTQ-005 | Role Protection | Login as RECEPTIONIST | No access to this page | Critical |

## 8.8 Technical Evaluation Form (`/interviewer/evaluate/$id`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| INTEV-001 | Page Load | Navigate to `/interviewer/evaluate/{id}` | Candidate details and evaluation form loaded | Critical |
| INTEV-002 | Scorecard Topics | View domain-specific topics | Topics loaded from `/api/scorecard/{domain}` | Major |
| INTEV-003 | Topic Ratings | Rate each topic 1-5 | All topics rated | Critical |
| INTEV-004 | Overall Scorecard | Fill overall assessment | Assessment scores saved | Major |
| INTEV-005 | Decision | Select COMPLETED/REJECTED/HOLD | Decision saved | Critical |
| INTEV-006 | Next Interviewer | Enter next interviewer email (if COMPLETED) | Email required when forwarding | Critical |
| INTEV-007 | Remarks | Enter remarks text | Remarks saved (max 2000 chars) | Minor |
| INTEV-008 | Submit | Fill all fields, submit evaluation | Round status updated, next round created if applicable | Critical |
| INTEV-009 | Assignment Check | Try to evaluate round not assigned to you | 403 "Access denied" | Critical |
| INTEV-010 | Already Evaluated | Try to evaluate already completed round | 400 "Already evaluated" | Critical |
| INTEV-011 | Last Round → CEO | Complete final technical round | Status → CEO_ROUND, CEO round created | Critical |

## 8.9 CEO Queue (`/ceo/queue`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| CEOQ-001 | Page Load | Login as CEO, navigate to `/ceo/queue` | CEO queue with two views | Critical |
| CEOQ-002 | CEO Reviews View | Toggle to "CEO Reviews" | Shows candidates in CEO_ROUND status | Major |
| CEOQ-003 | Final Decisions View | Toggle to "Final Decisions" | Shows candidates in FINAL_DISCUSSION_PENDING | Major |
| CEOQ-004 | Evaluate Button | Click "Evaluate" | Navigate to `/ceo/evaluate/{id}` | Critical |
| CEOQ-005 | Decide Button | Click "Decide" | Navigate to `/final-decision/{id}` or `/final-discussion/{id}` | Critical |

## 8.10 CEO Evaluation Form (`/ceo/evaluate/$id`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| CEOEV-001 | Page Load | Navigate to `/ceo/evaluate/{id}` | Candidate details and CEO scorecard | Critical |
| CEOEV-002 | Scorecard | Fill CEO-specific scorecard dimensions | Scores saved | Major |
| CEOEV-003 | Remarks | Enter executive remarks | Remarks saved | Critical |
| CEOEV-004 | Save Draft | Click "Save Draft" | Status stays CEO_ROUND, round status = UNDER_REVIEW | Major |
| CEOEV-005 | Submit | Click "Submit" | Status → FINAL_DISCUSSION_PENDING | Critical |
| CEOEV-006 | Validation | Submit without minimum 5-char remarks | Validation error | Major |

## 8.11 Final Discussion Page (`/final-discussion/$id`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| FD-001 | Page Load | Navigate to `/final-discussion/{id}` | Candidate details, technical scores, CEO scores shown | Critical |
| FD-002 | Tabs | Switch between Technical/CEO/Profile tabs | Correct data shown per tab | Major |
| FD-003 | Discussion Notes | Enter HR discussion notes | Notes saved on submit | Major |
| FD-004 | CEO Discussion | Enter CEO discussion notes | Notes saved on submit | Major |
| FD-005 | Final Status | Select SELECTED/REJECTED/HOLD | Status value saved | Critical |
| FD-006 | CTC | Enter offered CTC (required for SELECTED) | CTC validated (>0 for SELECTED) | Critical |
| FD-007 | Joining Date | Select joining date (required for SELECTED) | Date saved | Critical |
| FD-008 | Submit Decision | Fill all required fields, submit | Candidate status updated, activity logged | Critical |

## 8.12 Final Decision Page (`/final-decision/$id`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| FDEC-001 | Page Load | Navigate to `/final-decision/{id}` | Panel feedback tabs + decision form | Critical |
| FDEC-002 | Technical Tab | View technical round scores | All technical round data shown | Major |
| FDEC-003 | CEO Tab | View CEO round scores | CEO evaluation data shown | Major |
| FDEC-004 | Decision Form | Fill outcome, CTC, joining date, remarks | Form validates correctly | Critical |
| FDEC-005 | Submit | Submit final decision | Status updated, activity logged | Critical |

## 8.13 Offer Dashboard (`/offer/dashboard`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| OFFD-001 | Page Load | Login as HR_ADMIN, navigate to `/offer/dashboard` | Dashboard with KPI cards | Critical |
| OFFD-002 | KPI Cards | View stats | Total Offers, Pending, Accepted, Declined, Avg Processing Days, This Month | Major |
| OFFD-003 | Recent Offers | View recent offers list | Offers shown with status badges | Major |
| OFFD-004 | Navigate to Queue | Click "View All" | Navigate to `/offer/queue` | Minor |

## 8.14 Offer Queue (`/offer/queue`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| OFFQ-001 | Page Load | Navigate to `/offer/queue` | Paginated offer list | Critical |
| OFFQ-002 | Status Tabs | Filter by All/Pending/Sent/Accepted/Declined | Correct offers shown | Major |
| OFFQ-003 | Search | Search by candidate name | Filtered results | Minor |
| OFFQ-004 | Create Offer | Click "Create Offer" for SELECTED candidate without offer | Navigate to `/offer/builder/{candidateId}` | Critical |

## 8.15 Offer Builder (`/offer/builder/$candidateId`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| OFFB-001 | Page Load | Navigate to `/offer/builder/{candidateId}` | Candidate details and offer form | Critical |
| OFFB-002 | Create Offer | Enter CTC, joining date, notes, click "Create & Send" | Offer created (DRAFT) then sent (SENT) | Critical |
| OFFB-003 | Save Draft | Enter partial details, click "Save Draft" | Offer saved as DRAFT | Major |
| OFFB-004 | Validation | Submit with CTC ≤ 0 | Validation error | Major |
| OFFB-005 | Existing Offer | Load page for candidate with existing DRAFT offer | Form pre-populated, update mode | Major |

## 8.16 Offer Preview (`/offer/preview/$candidateId`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| OFFP-001 | Page Load | Navigate to `/offer/preview/{candidateId}` | Print-friendly offer letter shown | Critical |
| OFFP-002 | Print | Click "Print" button | Browser print dialog opened | Minor |
| OFFP-003 | Mark Sent | Click "Mark as Sent" | Offer status → SENT, `sent_at` timestamp set | Critical |
| OFFP-004 | Accept | Click "Accept" button | Offer status → ACCEPTED | Critical |
| OFFP-005 | Decline | Click "Decline" button | Offer status → DECLINED | Critical |

## 8.17 Offer Status Page (`/offer/status/$candidateId`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| OFFS-001 | Page Load | Navigate to `/offer/status/{candidateId}` | Vertical timeline showing status progression | Major |
| OFFS-002 | Timeline | View status history | Each status change shown with timestamp | Major |
| OFFS-003 | Activity History | View activity log section | All offer-related activities listed | Minor |

## 8.18 Onboarding Dashboard (`/onboarding/dashboard`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| ONBD-001 | Page Load | Login as HR_ADMIN, navigate to `/onboarding/dashboard` | Dashboard with KPI cards | Critical |
| ONBD-002 | KPI Cards | View stats | Total Employees, In Progress, Completed, Pending Docs, BGV Pending, IT Assets Pending, Joining This Month | Major |
| ONBD-003 | Recent Activity | View activity list | Recent onboarding activities shown | Minor |

## 8.19 Onboarding Queue (`/onboarding/queue`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| ONBQ-001 | Page Load | Navigate to `/onboarding/queue` | Paginated onboarding list | Critical |
| ONBQ-002 | Status Filter | Filter by All/Pending/In Progress/Completed | Correct records shown | Major |
| ONBQ-003 | Progress Bar | View progress percentage | Calculated from checklist completion | Major |
| ONBQ-004 | Navigate to Detail | Click on candidate | Navigate to `/onboarding/{candidateId}` | Critical |

## 8.20 Onboarding Detail (`/onboarding/$candidateId`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| ONBDT-001 | Page Load | Navigate to `/onboarding/{candidateId}` | Full onboarding profile with 6 tabs | Critical |
| ONBDT-002 | Overview Tab | View overview | Candidate info, progress summary | Major |
| ONBDT-003 | Documents Tab | View documents | 8 document types shown (AADHAAR, PAN, PASSPORT, DL, EDUCATION, EXPERIENCE, RESUME, OFFER_LETTER) | Critical |
| ONBDT-004 | Verify Document | Click "Verify" on a document | Document status → VERIFIED | Critical |
| ONBDT-005 | Reject Document | Click "Reject" on a document | Document status → REJECTED | Critical |
| ONBDT-006 | BGV Tab | View background checks | 4 categories (REFERENCE, EMPLOYMENT, EDUCATION, CRIMINAL) | Critical |
| ONBDT-007 | Clear BGV | Click "Clear" on a BGV item | BGV status → CLEARED | Critical |
| ONBDT-008 | Fail BGV | Click "Fail" on a BGV item | BGV status → FAILED | Critical |
| ONBDT-009 | IT Assets Tab | View assets | 7 asset types (LAPTOP, MONITOR, PHONE, EMAIL, ACCESS_CARD, VPN, SOFTWARE_LICENSES) | Critical |
| ONBDT-010 | Allocate Asset | Click "Allocate" on an asset | Asset status → ALLOCATED | Critical |
| ONBDT-011 | Checklist Tab | View checklist | 8 predefined items | Major |
| ONBDT-012 | Toggle Checklist | Click on checklist item | `is_completed` toggled, progress % updated | Critical |
| ONBDT-013 | Timeline Tab | View activity timeline | Onboarding activities listed | Minor |
| ONBDT-014 | Start Onboarding | Click "Start Onboarding" (if no onboarding record) | POST `/api/onboarding`, record created | Critical |

## 8.21 Candidate Portal (`/candidate-portal/$candidateId`)

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| CPTL-001 | Page Load | Navigate to `/candidate-portal/{candidateId}` | Public page with application summary | Critical |
| CPTL-002 | Application Summary | View candidate info | Shows name, email, phone, position, status | Major |
| CPTL-003 | Offer Details | View offer section | Shows CTC, joining date, status (if offer exists) | Major |
| CPTL-004 | No Auth Required | Access without login | Page loads successfully | Critical |
| CPTL-005 | Invalid ID | Navigate with non-existent ID | Error page or message | Minor |

---

# 9. BUTTON TESTING

## 9.1 Login Page Buttons

| Button | Location | API Called | Permission | Validation | Expected Result |
|--------|----------|-----------|------------|------------|-----------------|
| Sign In | `/login` | `POST /api/auth/login` | None | Email format, non-empty password | Login success or error toast |

## 9.2 Navigation Sidebar Buttons

| Button | Location | Target | Permission | Expected Result |
|--------|----------|--------|------------|-----------------|
| Dashboard | Sidebar | `/dashboard` | Any authenticated | Navigate to dashboard |
| Candidates | Sidebar | `/candidates` | `candidate.list` or `workflow.reception_forward` | Navigate to candidates list |
| HR Review Queue | Sidebar | `/hr/queue` | `workflow.hr_review` | Navigate to HR queue |
| Interview Queue | Sidebar | `/interviewer/queue` | `evaluation.view_assigned` | Navigate to interview queue |
| CEO Review Queue | Sidebar | `/ceo/queue` | `workflow.ceo_evaluate` or `decision.final` | Navigate to CEO queue |
| Offer Management | Sidebar | `/offer/dashboard` | `decision.final` | Navigate to offer dashboard |
| Onboarding | Sidebar | `/onboarding/dashboard` | `decision.final` | Navigate to onboarding dashboard |
| Sign out | Sidebar | — | Any authenticated | Logout, redirect to `/login` |

## 9.3 Candidate List Action Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Review (HR) | Candidate row (RECEPTION_FORWARDED) | Navigation to `/hr/review/{id}` | `workflow.hr_review` | Navigate to HR review form |
| Evaluate | Candidate row (TECH_ROUND_N) | Navigation to `/interviewer/evaluate/{id}` | `workflow.technical_evaluate` | Navigate to evaluation form |
| CEO Review | Candidate row (CEO_ROUND) | Navigation to `/ceo/evaluate/{id}` | `workflow.ceo_evaluate` | Navigate to CEO evaluation |
| Decide | Candidate row (FINAL_DISCUSSION_PENDING) | Navigation to `/final-decision/{id}` | `decision.final` | Navigate to final decision form |
| Forward to HR | Candidate row (SUBMITTED/awaiting) | `POST /api/workflow/receptionist/forward/{id}` | `workflow.reception_forward` | Status → RECEPTION_FORWARDED |
| Reject | Candidate row | `POST /api/workflow/receptionist/reject/{id}` | `workflow.reception_forward` | Status → REJECTED |

## 9.4 HR Review Form Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Submit Review | `/hr/review/{id}` | `POST /api/workflow/hr/review/{id}` | `workflow.hr_review` | Status updated, rounds created |

## 9.5 Interviewer Evaluation Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Submit Evaluation | `/interviewer/evaluate/{id}` | `POST /api/workflow/technical/evaluate/{id}/{round}` | `workflow.technical_evaluate` | Round evaluated, next round/CEO created |

## 9.6 CEO Evaluation Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Save Draft | `/ceo/evaluate/{id}` | `POST /api/workflow/ceo/evaluate/{id}` (save_draft=true) | `workflow.ceo_evaluate` | Draft saved, status unchanged |
| Submit | `/ceo/evaluate/{id}` | `POST /api/workflow/ceo/evaluate/{id}` (save_draft=false) | `workflow.ceo_evaluate` | Status → FINAL_DISCUSSION_PENDING |

## 9.7 Final Decision Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Submit Decision | `/final-decision/{id}` or `/final-discussion/{id}` | `POST /api/workflow/final-decision/{id}` | `decision.final` | Status updated to SELECTED/REJECTED/ON_HOLD |
| Save Draft | Same | `POST /api/workflow/final-decision/{id}` (save_draft=true) | `decision.final` | Draft saved, status unchanged |

## 9.8 Offer Management Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Create Offer | `/offer/builder/{id}` | `POST /api/offers` | `offer.create` | Offer created (DRAFT) |
| Save Draft | `/offer/builder/{id}` | `POST /api/offers` or `PUT /api/offers/{id}` | `offer.update` | Draft saved |
| Create & Send | `/offer/builder/{id}` | `POST /api/offers` + `POST /api/offers/{id}/send` | `offer.create` + `offer.send` | Offer created and sent |
| Send Offer | `/offer/preview/{id}` | `POST /api/offers/{id}/send` | `offer.send` | Status → SENT |
| Accept Offer | `/offer/preview/{id}` | `POST /api/offers/{id}/accept` | `offer.approve` | Status → ACCEPTED |
| Decline Offer | `/offer/preview/{id}` | `POST /api/offers/{id}/decline` | `offer.decline` | Status → DECLINED |
| Print | `/offer/preview/{id}` | — | — | Browser print dialog |

## 9.9 Onboarding Detail Buttons

| Button | Location | API Called | Permission | Expected Result |
|--------|----------|-----------|------------|-----------------|
| Start Onboarding | `/onboarding/{id}` | `POST /api/onboarding` | `onboarding.manage` | Onboarding record created |
| Verify Document | Onboarding detail | `POST /api/onboarding/{id}/documents/{type}/verify` | `onboarding.verify` | Document status → VERIFIED |
| Reject Document | Onboarding detail | `POST /api/onboarding/{id}/documents/{type}/reject` | `onboarding.verify` | Document status → REJECTED |
| Clear BGV | Onboarding detail | `POST /api/onboarding/{id}/bgv/{category}/clear` | `onboarding.verify` | BGV status → CLEARED |
| Fail BGV | Onboarding detail | `POST /api/onboarding/{id}/bgv/{category}/fail` | `onboarding.verify` | BGV status → FAILED |
| Allocate Asset | Onboarding detail | `POST /api/onboarding/{id}/assets/{type}/allocate` | `onboarding.allocate` | Asset status → ALLOCATED |
| Toggle Checklist | Onboarding detail | `PUT /api/onboarding/{id}/checklist/{item}` | `onboarding.manage` | `is_completed` toggled |

---

# 10. FORM VALIDATION TESTS

## 10.1 Registration Form - Personal Details

| Field | Validation Rule | Test Input | Expected Result |
|-------|-----------------|------------|-----------------|
| first_name | Required, 1-50 chars | "" | Error: "First name is required" |
| last_name | Required, 1-50 chars | "" | Error: "Last name is required" |
| email | Required, valid email format | "invalid-email" | Error: "Invalid email address format" |
| phone | Required, exactly 10 digits | "12345" | Error: "Phone number must be exactly 10 digits" |
| alternate_phone | Optional, 10 digits if provided | "123" | Error: "Alternate phone number must be exactly 10 digits" |
| gender | Required, one of MALE/FEMALE/OTHER | "" | Error: "Select a gender" |
| date_of_birth | Required, not future date | "2030-01-01" | Error: "Date of birth cannot be a future date" |
| current_address | Required, min 5 chars | "abc" | Error: "Current address must be at least 5 characters" |
| city | Required | "" | Error: "City is required" |
| state | Required | "" | Error: "State is required" |
| country | Required | "" | Error: "Country is required" |
| pincode | Required, 4-10 chars | "12" | Error: "Pincode must be between 4 and 10 characters" |
| position_applied_for | Required | "" | Error: "Position applied for is required" |

## 10.2 Registration Form - Professional Details

| Field | Validation Rule | Test Input | Expected Result |
|-------|-----------------|------------|-----------------|
| total_experience | Required, non-negative number | "-1" | Error: "Total experience must be a non-negative number" |
| relevant_experience | Required, non-negative number | "abc" | Error: "Relevant experience must be a non-negative number" |
| current_ctc | Optional, non-negative if provided | "-500" | Error: "Current CTC must be a non-negative number" |
| expected_ctc | Optional, non-negative if provided | "-100" | Error: "Expected CTC must be a non-negative number" |
| employment_type | Required, one of FULL_TIME/PART_TIME/CONTRACT/INTERN | "" | Error: "Employment type is required" |

## 10.3 Registration Form - Employment History

| Field | Validation Rule | Test Input | Expected Result |
|-------|-----------------|------------|-----------------|
| company_name | Required if row has data | "" (with other fields filled) | Error: "Please fill out all required fields" |
| designation | Required if row has data | "" (with other fields filled) | Error: "Please fill out all required fields" |
| start_date | Required if row has data | "" (with other fields filled) | Error: "Please fill out all required fields" |
| end_date | Must be after start_date if provided | end < start | Error: "End date cannot be before start date" |

## 10.4 Registration Form - Education

| Field | Validation Rule | Test Input | Expected Result |
|-------|-----------------|------------|-----------------|
| qualification | Required | "" | Error: "Please fill out all required fields" |
| institution_name | Required | "" | Error: "Please fill out all required fields" |
| passing_year | Required, 1900-current year | "1800" | Error: "Passing year must be between 1900 and {year}" |
| percentage | Optional, 0-100 if provided | "150" | Error: "Percentage must be between 0 and 100" |

## 10.5 Registration Form - Assessments

| Section | Validation Rule | Test Input | Expected Result |
|---------|-----------------|------------|-----------------|
| Personality | All 18 statements rated (1-5) | Some unrated (value=0) | Error: "Please rate all 18 perspective statements" |
| Situational | All 5 scenarios answered (A/B/C/D) | Some unanswered | Error: "Please answer all 5 workplace scenarios" |
| Written | All 5 answers min 20 chars | Short answer | Error: "Descriptive Question #N must be at least 20 characters long" |
| Declaration | Both checkboxes checked | Unchecked | Error: "You must accept both declaration and consent terms" |
| Signature | PDF file uploaded | No file | Error: "You must upload your signature PDF before submitting" |

## 10.6 HR Review Form Validation

| Field | Validation Rule | Expected Result |
|-------|-----------------|-----------------|
| domain | Required, 1-100 chars | Error if empty |
| number_of_tech_rounds | Required, 1-10 | Error if < 1 |
| hr_status | Required, SELECT/REJECT/HOLD | Error if invalid |
| first_interviewer_email | Required, valid email | Error if invalid email |

## 10.7 Offer Form Validation

| Field | Validation Rule | Expected Result |
|-------|-----------------|-----------------|
| offered_ctc | Optional, > 0 if provided | Error if ≤ 0 |
| joining_date | Optional, valid date | Error if invalid date |

## 10.8 Final Decision Validation

| Field | Validation Rule | Expected Result |
|-------|-----------------|-----------------|
| final_status | Required (if not draft), SELECTED/REJECT/HOLD | Error if empty |
| offered_ctc | Required if SELECTED, > 0 | Error if missing or ≤ 0 |
| joining_date | Required if SELECTED | Error if missing |
| remarks | Max 2000 chars | Truncated or error |

---

# 11. DASHBOARD TESTS

## 11.1 Dashboard API Response Verification

| Test ID | Endpoint | Verification | Priority |
|---------|----------|--------------|----------|
| DASH-API-001 | `GET /api/dashboard-alerts` | `pending_review` count matches candidates in SUBMITTED/RECEPTION_FORWARDED | Critical |
| DASH-API-002 | `GET /api/dashboard-alerts` | `interviews_today` count matches PENDING rounds created today | Critical |
| DASH-API-003 | `GET /api/dashboard-alerts` | `interviews_this_week` count matches PENDING rounds this week | Major |
| DASH-API-004 | `GET /api/dashboard-alerts` | `offers_pending` count matches DRAFT+SENT offers | Major |
| DASH-API-005 | `GET /api/dashboard-alerts` | `joinings_today` count matches onboarding with today's joining_date | Major |
| DASH-API-006 | `GET /api/reports/dashboard/summary` | `total_candidates` matches total candidate count | Major |
| DASH-API-007 | `GET /api/reports/dashboard/summary` | `total_offers` matches total offer count | Major |
| DASH-API-008 | `GET /api/offers/stats` | Stats match offer table aggregations | Major |
| DASH-API-009 | `GET /api/onboarding/stats` | Stats match onboarding table aggregations | Major |

---

# 12. NOTIFICATION TESTS

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| NOTIF-001 | Notification Creation | Receptionist forwards candidate | HR_ADMIN users receive "Candidate Ready for HR Review" notification | Critical |
| NOTIF-002 | Notification List | Click notification bell | Dropdown shows notifications | Critical |
| NOTIF-003 | Unread Count | View badge on bell icon | Count matches unread notifications | Major |
| NOTIF-004 | Mark as Read | Click notification | `is_read` → true, `read_at` timestamp set | Major |
| NOTIF-005 | Mark All Read | Click "Mark all as read" | All notifications marked as read | Major |
| NOTIF-006 | Delete | Delete a notification | Notification removed from list | Minor |
| NOTIF-007 | Category Filter | Filter by category | Only matching notifications shown | Minor |
| NOTIF-008 | Action URL | Click notification with action_url | Navigate to target page | Major |

---

# 13. ROLE-BASED ACCESS TESTS

## 13.1 Page Access Matrix

| Page | SYSTEM_ADMIN | HR_ADMIN | RECEPTIONIST | L1_PANEL | L2_PANEL | TECH_HEAD | CEO |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/candidates` | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `/hr/queue` | ✅ | ✅ | — | — | — | — | — |
| `/hr/review/$id` | ✅ | ✅ | — | — | — | — | — |
| `/interviewer/queue` | ✅ | — | — | ✅ | ✅ | ✅ | — |
| `/interviewer/evaluate/$id` | ✅ | — | — | ✅ | ✅ | ✅ | — |
| `/ceo/queue` | ✅ | — | — | — | ✅ | — | ✅ |
| `/ceo/evaluate/$id` | ✅ | — | — | — | ✅ | — | ✅ |
| `/final-discussion/$id` | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| `/final-decision/$id` | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| `/offer/dashboard` | ✅ | ✅ | — | — | — | — | — |
| `/offer/queue` | ✅ | ✅ | — | — | — | — | — |
| `/offer/builder/$id` | ✅ | ✅ | — | — | — | — | — |
| `/offer/preview/$id` | ✅ | ✅ | — | — | — | — | — |
| `/onboarding/dashboard` | ✅ | ✅ | — | — | — | — | — |
| `/onboarding/queue` | ✅ | ✅ | — | — | — | — | — |
| `/onboarding/$id` | ✅ | ✅ | — | — | — | — | — |

## 13.2 API Access Matrix (Key Endpoints)

| API | SYSTEM_ADMIN | HR_ADMIN | RECEPTIONIST | L1_PANEL | CEO |
|-----|:---:|:---:|:---:|:---:|:---:|
| `GET /api/applicants` | ✅ | ✅ | ✅ | — | ✅ |
| `POST /api/workflow/receptionist/forward/{id}` | ✅ | — | ✅ | — | — |
| `POST /api/workflow/hr/review/{id}` | ✅ | ✅ | — | — | — |
| `POST /api/workflow/technical/evaluate/{id}/{round}` | ✅ | — | — | ✅ | — |
| `POST /api/workflow/ceo/evaluate/{id}` | ✅ | — | — | — | ✅ |
| `POST /api/workflow/final-decision/{id}` | ✅ | ✅ | — | — | ✅ |
| `POST /api/offers` | ✅ | ✅ | — | — | — |
| `POST /api/onboarding` | ✅ | ✅ | — | — | — |
| `GET /api/users` | ✅ | — | — | — | — |
| `DELETE /api/applicant/{id}` | ✅ | ✅ | — | — | — |

## 13.3 Unauthorized Access Tests

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| RBAC-001 | No token | Call any protected API without Authorization header | 401 Unauthorized | Critical |
| RBAC-002 | Expired token | Use an expired JWT token | 401 Unauthorized | Critical |
| RBAC-003 | Invalid token | Use a malformed JWT token | 401 Unauthorized | Critical |
| RBAC-004 | Insufficient permissions | Login as RECEPTIONIST, call `/api/workflow/hr/review/{id}` | 403 Forbidden | Critical |
| RBAC-005 | Wrong role page | Login as L1_PANEL, navigate to `/hr/queue` | Redirect or 403 | Critical |
| RBAC-006 | Inactive user | Login with `is_active=false` account | 400 "Inactive user" | Critical |
| RBAC-007 | Self-deletion | Try to delete own account | 400 "Cannot delete your own account" | Major |

---

# 14. FILE UPLOAD TESTS

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| FILE-001 | Signature Upload (PDF) | Upload valid PDF file | File accepted, stored in `/backend/uploads/` | Critical |
| FILE-002 | Invalid Format | Upload .exe or .txt file as signature | Error or rejection | Major |
| FILE-003 | Large File | Upload file > 5MB | Error: file too large | Major |
| FILE-004 | No File | Submit without signature file | Error: "Signature file is required" | Critical |
| FILE-005 | Document Upload | Upload via `/api/documents/upload/{candidateId}` | Document stored, metadata saved | Critical |
| FILE-006 | Document Download | Download via `/api/documents/{id}/download` | File returned with correct content-type | Critical |
| FILE-007 | Document Versioning | Upload same document_type twice | Version incremented, old version marked `is_latest=false` | Major |
| FILE-008 | Delete Document | Delete via `/api/documents/{id}` | Record removed, `is_latest` updated | Major |

---

# 15. SEARCH TESTS

| Test ID | Feature | Steps | Expected Result | Priority |
|---------|---------|-------|-----------------|----------|
| SRCH-001 | Basic Search | Enter search term in candidate search | Results matching name/email/phone shown | Major |
| SRCH-002 | Empty Results | Search for non-existent term | "No results found" message | Minor |
| SRCH-003 | Special Characters | Search with `@`, `#`, `%` | No crash, proper handling | Minor |
| SRCH-004 | Global Search | Call `GET /api/search?q={term}` | Returns results across entities | Major |
| SRCH-005 | Type Filter | Call `GET /api/search?q={term}&type=candidate` | Only candidate results returned | Minor |
| SRCH-006 | Save Search | Save a search query | Search saved to `saved_searches` table | Minor |
| SRCH-007 | Saved Search List | List saved searches | All user's saved searches shown | Minor |
| SRCH-008 | Delete Saved Search | Delete a saved search | Removed from list | Minor |
| SRCH-009 | Pagination | Search with skip/limit | Correct page returned | Minor |

---

# 16. ERROR HANDLING TESTS

| Test ID | HTTP Code | Scenario | Expected Frontend Behavior | Priority |
|---------|-----------|----------|---------------------------|----------|
| ERR-001 | 401 | Invalid/expired token | Clear tokens, redirect to `/login` | Critical |
| ERR-002 | 403 | Insufficient permissions | Error toast "Operation not permitted" | Critical |
| ERR-003 | 404 | Resource not found | Error toast "Not found" or page not found | Major |
| ERR-004 | 409 | Conflict (duplicate, already evaluated) | Error toast with conflict message | Major |
| ERR-005 | 422 | Validation error (Pydantic) | Error toast with validation details | Major |
| ERR-006 | 429 | Rate limit exceeded | Error toast "Too many requests" | Major |
| ERR-007 | 500 | Server error | Error toast "Request failed" | Critical |
| ERR-008 | 503 | Service unavailable (DB down) | Health check returns 503, error shown | Critical |
| ERR-009 | Network failure | Backend unreachable | "Cannot reach backend at {url}" error | Critical |
| ERR-010 | Token refresh failure | Refresh token expired | Clear auth, redirect to `/login` | Critical |

---

# 17. SECURITY TESTS

| Test ID | Category | Test | Expected Result | Priority |
|---------|----------|------|-----------------|----------|
| SEC-001 | Authentication | Access protected route without token | 401 Unauthorized | Critical |
| SEC-002 | Authentication | Use expired access token | Auto-refresh via refresh token | Critical |
| SEC-003 | Authentication | Use expired refresh token | 401, redirect to login | Critical |
| SEC-004 | RBAC | User A tries to access User B's restricted resource | 403 Forbidden | Critical |
| SEC-005 | RBAC | RECEPTIONIST tries to call HR review API | 403 Forbidden | Critical |
| SEC-006 | RBAC | L1_PANEL tries to access CEO evaluation | 403 or hidden UI | Critical |
| SEC-007 | SQL Injection | Enter `' OR 1=1 --` in search/email fields | Input sanitized, no injection | Critical |
| SEC-008 | XSS | Enter `<script>alert('xss')</script>` in text fields | Input escaped, no script execution | Critical |
| SEC-009 | CSRF | Submit cross-origin form | CORS middleware blocks | Major |
| SEC-010 | File Upload | Upload malicious file (.exe, .php) | File type validation rejects | Critical |
| SEC-011 | Password Storage | Check database for passwords | Only bcrypt hashes stored | Critical |
| SEC-012 | JWT Secret | Check for hardcoded JWT secret | Secret from environment variable only | Critical |
| SEC-013 | Rate Limiting | Rapid-fire login attempts | Rate limiter blocks after threshold | Major |
| SEC-014 | Security Headers | Check response headers | X-Content-Type-Options: nosniff, X-Frame-Options: DENY, etc. | Major |
| SEC-015 | Direct URL Access | Access `/admin` or internal routes | 404 or proper routing | Minor |
| SEC-016 | Broken Access Control | Access other user's notifications | Only own notifications returned | Critical |
| SEC-017 | Token in URL | Check for tokens in URL query params | Tokens only in headers/localStorage | Major |

---

# 18. DATABASE VERIFICATION

## 18.1 After Candidate Registration

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | INSERT | status=SUBMITTED, application_number generated |
| `applicant_professional_details` | INSERT | Linked to candidate |
| `applicant_employment_history` | INSERT (0-N) | Linked to candidate |
| `applicant_education` | INSERT (1-N) | Linked to candidate |
| `applicant_personality_assessment` | INSERT (18) | rating 1-5 |
| `applicant_situational_responses` | INSERT (5) | selected_option A-D |
| `applicant_written_responses` | INSERT (5) | answer_text |
| `applicant_declaration` | INSERT | declaration_accepted=true, consent_accepted=true |
| `candidate_documents` | INSERT | document_type=SIGNATURE_PDF |
| `candidate_activity_logs` | INSERT | action="Application Submitted" |

## 18.2 After Receptionist Forward

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → RECEPTION_FORWARDED |
| `candidate_activity_logs` | INSERT (2) | "Candidate Checked In", "Candidate Status Changed" |
| `notifications` | INSERT | user_id=HR_ADMIN users, title="Candidate Ready for HR Review" |

## 18.3 After HR Review (SELECT)

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → TECH_ROUND_1, domain set, total_rounds set |
| `interview_rounds` | INSERT (2) | Round 0 (HR_REVIEW, COMPLETED), Round 1 (TECHNICAL, PENDING) |
| `candidate_assignments` | INSERT | assigned_to=first_interviewer_email, status=ACTIVE |
| `candidate_activity_logs` | INSERT (2) | "HR Submitted Review", "Candidate Status Changed" |

## 18.4 After Technical Evaluation (COMPLETED, not last round)

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → TECH_ROUND_{N+1} |
| `interview_rounds` | UPDATE + INSERT | Current round → COMPLETED, new round → PENDING |
| `candidate_assignments` | UPDATE + INSERT | Current → COMPLETED, new → ACTIVE |
| `candidate_activity_logs` | INSERT (2) | "Technical Round Submitted", "Candidate Status Changed" |

## 18.5 After Technical Evaluation (COMPLETED, last round)

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → CEO_ROUND |
| `interview_rounds` | UPDATE + INSERT | Current → COMPLETED, CEO round → PENDING |
| `candidate_assignments` | UPDATE + INSERT | Current → COMPLETED, CEO → ACTIVE |
| `candidate_activity_logs` | INSERT (2) | "Technical Round Submitted", "Candidate Status Changed" |

## 18.6 After CEO Evaluation (Submit)

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → FINAL_DISCUSSION_PENDING |
| `interview_rounds` | UPDATE | CEO round → COMPLETED |
| `candidate_assignments` | UPDATE | ACTIVE → COMPLETED |
| `candidate_activity_logs` | INSERT (2) | "CEO Scorecard Submitted", "Candidate Status Changed" |

## 18.7 After Final Decision (SELECTED)

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `candidates` | UPDATE | status → SELECTED |
| `final_decisions` | INSERT/UPDATE | final_status=SELECTED, offered_ctc, joining_date, approved_by |
| `candidate_assignments` | UPDATE | ACTIVE → COMPLETED |
| `candidate_activity_logs` | INSERT (2) | "Final Decision Submitted", "Candidate Selected" |

## 18.8 After Offer Created

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `offers` | INSERT | status=DRAFT, candidate_id, offered_ctc, joining_date |

## 18.9 After Offer Sent

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `offers` | UPDATE | status → SENT, sent_at timestamp |
| `offer_history` | INSERT | action="Offer Sent" |

## 18.10 After Offer Accepted

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `offers` | UPDATE | status → ACCEPTED, responded_at timestamp |
| `offer_history` | INSERT | action="Offer Accepted" |

## 18.11 After Onboarding Started

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `onboarding` | INSERT | status=PENDING, candidate_id |
| `document_verification` | INSERT (8) | One per document type, all PENDING |
| `background_verification` | INSERT (4) | One per category, all PENDING |
| `asset_allocation` | INSERT (7) | One per asset type, all PENDING |
| `employee_checklist` | INSERT (8) | One per item, all is_completed=false |

## 18.12 After Document Verified

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `document_verification` | UPDATE | status → VERIFIED, verified_by, verified_at |

## 18.13 After BGV Cleared

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `background_verification` | UPDATE | status → CLEARED, verified_by, verified_at |

## 18.14 After Asset Allocated

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `asset_allocation` | UPDATE | status → ALLOCATED, asset_id, allocated_by, allocated_at |

## 18.15 After Checklist Item Completed

| Table | Changes | Expected Values |
|-------|---------|-----------------|
| `employee_checklist` | UPDATE | is_completed=true, completed_by, completed_at |

---

# 19. COMPLETE END-TO-END TEST SCRIPT

This is a continuous test script covering the full recruitment lifecycle.

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173` or `http://localhost:3000`
- Database seeded with all roles and users
- Test accounts: admin@atlas.com, hr.admin@atlas.com, reception@atlas.com, l1.panel@atlas.com, l2.panel@atlas.com, tech.head@atlas.com
- Common password: `ChangeMe!Admin123!`

### Step 1: Candidate Registration (Public)

1. Navigate to `http://localhost:5173/register-candidate`
2. **Step 0 - Personal Details:**
   - Enter First Name: `John`
   - Enter Last Name: `Doe`
   - Enter Email: `john.doe.test@example.com`
   - Enter Phone: `9876543210`
   - Select Gender: `Male`
   - Enter DOB: `1990-05-15`
   - Enter Position: `Senior Software Engineer`
   - Enter Address: `123 Main Street, Koramangala`
   - Enter City: `Bangalore`
   - Enter State: `Karnataka`
   - Enter Country: `India`
   - Enter Pincode: `560034`
   - Click "Next"
3. **Step 1 - Professional Details:**
   - Enter Total Experience: `5`
   - Enter Relevant Experience: `4`
   - Enter Current Company: `TechCorp`
   - Enter Current Designation: `Software Engineer`
   - Enter Current CTC: `15`
   - Enter Expected CTC: `22`
   - Enter Notice Period: `30 days`
   - Select Employment Type: `Full time`
   - Click "Next"
4. **Step 2 - Employment History:**
   - Company: `TechCorp`, Designation: `Software Engineer`, Start: `2020-01-01`, End: `2024-12-31`
   - Click "Next"
5. **Step 3 - Education:**
   - Qualification: `B.Tech CSE`, Institution: `IIT Bangalore`, University: `VTU`, Year: `2019`, Percentage: `85`
   - Click "Next"
6. **Step 4 - Personality Assessment:** Rate all 18 statements (1-5). Click "Next"
7. **Step 5 - Situational Responses:** Answer all 5 scenarios (A/B/C/D). Click "Next"
8. **Step 6 - Written Responses:** Answer all 5 questions (min 20 chars each). Click "Next"
9. **Step 7 - Declaration:**
   - Check declaration checkbox
   - Check consent checkbox
   - Upload signature PDF
   - Click "Submit Application"

**Verification:**
- ✅ Success page shown with application number
- ✅ `candidates` table: status = `SUBMITTED`
- ✅ `candidate_activity_logs`: action = `Application Submitted`

### Step 2: Receptionist Check-in

1. Login as `reception@atlas.com` / `ChangeMe!Admin123!`
2. Navigate to `/candidates`
3. Find `John Doe` (status: SUBMITTED or "Submitted — awaiting reception")
4. Click "Forward to HR" button

**Verification:**
- ✅ Candidate status → `RECEPTION_FORWARDED`
- ✅ `candidate_activity_logs`: "Candidate Checked In", "Candidate Status Changed"
- ✅ `notifications`: HR_ADMIN users receive notification

### Step 3: HR Review

1. Login as `hr.admin@atlas.com` / `ChangeMe!Admin123!`
2. Navigate to `/hr/queue`
3. Find `John Doe` in the queue (status: RECEPTION_FORWARDED)
4. Click "Review"
5. Fill HR Review Form:
   - Domain: `SAP ABAP`
   - Number of Tech Rounds: `2`
   - HR Status: `SELECT`
   - First Interviewer Email: `l1.panel@atlas.com`
   - Fill behavioral scorecard
6. Click "Submit Review"

**Verification:**
- ✅ Candidate status → `TECH_ROUND_1`
- ✅ `interview_rounds`: Round 0 (HR_REVIEW, COMPLETED), Round 1 (TECHNICAL, PENDING, assigned to l1.panel@atlas.com)
- ✅ `candidate_assignments`: ACTIVE assignment to l1.panel@atlas.com
- ✅ `candidate_activity_logs`: "HR Submitted Review", "Candidate Status Changed"

### Step 4: L1 Technical Evaluation

1. Login as `l1.panel@atlas.com` / `ChangeMe!Admin123!`
2. Navigate to `/interviewer/queue`
3. Find `John Doe` round 1
4. Click "Evaluate"
5. Fill evaluation:
   - Rate all topics 1-5
   - Decision: `COMPLETED`
   - Next Interviewer: `l2.panel@atlas.com`
   - Remarks: `Strong technical skills`
6. Click "Submit Evaluation"

**Verification:**
- ✅ Candidate status → `TECH_ROUND_2`
- ✅ Round 1 status → COMPLETED
- ✅ Round 2 created (TECHNICAL, PENDING, assigned to l2.panel@atlas.com)
- ✅ `candidate_activity_logs`: "Technical Round Submitted", "Candidate Status Changed"

### Step 5: L2 Technical Evaluation (Last Round)

1. Login as `l2.panel@atlas.com` / `ChangeMe!Admin123!`
2. Navigate to `/interviewer/queue`
3. Find `John Doe` round 2
4. Click "Evaluate"
5. Fill evaluation:
   - Rate all topics 1-5
   - Decision: `COMPLETED`
   - (No next interviewer - this is the last round)
   - Remarks: `Excellent problem-solving`
6. Click "Submit Evaluation"

**Verification:**
- ✅ Candidate status → `CEO_ROUND`
- ✅ Round 2 status → COMPLETED
- ✅ CEO round created (CEO_ROUND, PENDING, assigned to admin@atlas.com)
- ✅ `candidate_activity_logs`: "Technical Round Submitted", "Candidate Status Changed"

### Step 6: CEO Evaluation

1. Login as `admin@atlas.com` / `ChangeMe!Admin123!`
2. Navigate to `/ceo/queue`
3. Find `John Doe` (CEO_ROUND status)
4. Click "Evaluate"
5. Fill CEO scorecard and remarks (min 5 chars)
6. Click "Submit"

**Verification:**
- ✅ Candidate status → `FINAL_DISCUSSION_PENDING`
- ✅ CEO round status → COMPLETED
- ✅ `candidate_activity_logs`: "CEO Scorecard Submitted", "Candidate Status Changed"

### Step 7: Final Decision

1. Still logged in as `admin@atlas.com`
2. Navigate to `/ceo/queue` → Final Decisions view
3. Find `John Doe` (FINAL_DISCUSSION_PENDING)
4. Click "Decide"
5. Fill decision form:
   - HR Discussion Notes: `Positive cultural fit`
   - CEO Discussion: `Strong technical and leadership potential`
   - Final Status: `SELECTED`
   - Offered CTC: `2500000`
   - Joining Date: `2026-08-15`
   - Approved By: `admin@atlas.com`
   - Final Remarks: `Approved for senior role`
6. Click "Submit Decision"

**Verification:**
- ✅ Candidate status → `SELECTED`
- ✅ `final_decisions`: final_status=SELECTED, offered_ctc=2500000, joining_date=2026-08-15
- ✅ `candidate_activity_logs`: "Final Decision Submitted", "Candidate Selected"

### Step 8: Create Offer

1. Login as `hr.admin@atlas.com`
2. Navigate to `/offer/queue`
3. Find `John Doe` (SELECTED status, no offer)
4. Click "Create Offer" or navigate to `/offer/builder/{candidateId}`
5. Fill offer:
   - Offered CTC: `2500000`
   - Joining Date: `2026-08-15`
   - Notes: `Welcome to Atlas HR!`
6. Click "Create & Send"

**Verification:**
- ✅ `offers` table: status → SENT, sent_at set
- ✅ `offer_history`: "Offer Sent" logged

### Step 9: Accept Offer

1. Navigate to `/offer/preview/{candidateId}`
2. Click "Accept" button

**Verification:**
- ✅ `offers` table: status → ACCEPTED, responded_at set
- ✅ `offer_history`: "Offer Accepted" logged

### Step 10: Start Onboarding

1. Navigate to `/onboarding/queue` or `/onboarding/{candidateId}`
2. Click "Start Onboarding"

**Verification:**
- ✅ `onboarding` table: status=PENDING, candidate_id linked
- ✅ `document_verification`: 8 records (AADHAAR, PAN, PASSPORT, DL, EDUCATION, EXPERIENCE, RESUME, OFFER_LETTER) all PENDING
- ✅ `background_verification`: 4 records (REFERENCE, EMPLOYMENT, EDUCATION, CRIMINAL) all PENDING
- ✅ `asset_allocation`: 7 records (LAPTOP, MONITOR, PHONE, EMAIL, ACCESS_CARD, VPN, SOFTWARE_LICENSES) all PENDING
- ✅ `employee_checklist`: 8 items all is_completed=false

### Step 11: Complete Onboarding Tasks

1. Navigate to `/onboarding/{candidateId}`
2. **Documents Tab:**
   - Verify AADHAAR → status → VERIFIED
   - Verify PAN → status → VERIFIED
   - Verify EDUCATION → status → VERIFIED
   - Verify EXPERIENCE → status → VERIFIED
   - Verify RESUME → status → VERIFIED
   - Verify OFFER_LETTER → status → VERIFIED
3. **BGV Tab:**
   - Clear REFERENCE → status → CLEARED
   - Clear EMPLOYMENT → status → CLEARED
   - Clear EDUCATION → status → CLEARED
   - Clear CRIMINAL → status → CLEARED
4. **IT Assets Tab:**
   - Allocate LAPTOP → status → ALLOCATED
   - Allocate PHONE → status → ALLOCATED
   - Allocate EMAIL → status → ALLOCATED
   - Allocate ACCESS_CARD → status → ALLOCATED
   - Allocate VPN → status → ALLOCATED
   - Allocate SOFTWARE_LICENSES → status → ALLOCATED
5. **Checklist Tab:**
   - Mark all 8 items as completed
6. **Update Status:**
   - Set status → IN_PROGRESS, then → COMPLETED

**Verification:**
- ✅ All document verifications: VERIFIED
- ✅ All BGV: CLEARED
- ✅ All assets: ALLOCATED
- ✅ All checklist items: is_completed=true
- ✅ Onboarding status → COMPLETED
- ✅ completed_at timestamp set

---

# 20. BUG TRACKING TABLE

| Bug ID | Module | Severity | Priority | Status | Description | Root Cause | Resolution | Regression |
|--------|--------|----------|----------|--------|-------------|------------|------------|------------|
| BUG-001 | — | — | — | — | To be filled during testing | — | — | — |
| BUG-002 | — | — | — | — | To be filled during testing | — | — | — |

*Template rows to be populated during test execution.*

---

# 21. AUTOMATION READINESS

| Feature | Can Automate | Needs API Mocking | Needs Seed Data | Needs DB Reset | Needs Login | Needs Role Switch | Recommended Framework |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|------|
| Login Flow | ✅ | No | Yes | No | No | No | Playwright / API |
| Token Refresh | ✅ | No | Yes | No | Yes | No | API Tests |
| Registration Form | ✅ | No | No | No | No | No | Playwright |
| Candidate List | ✅ | No | Yes | Yes | Yes | Yes | Playwright |
| HR Review | ✅ | No | Yes | Yes | Yes | Yes | Playwright + API |
| Technical Evaluation | ✅ | No | Yes | Yes | Yes | Yes | Playwright + API |
| CEO Evaluation | ✅ | No | Yes | Yes | Yes | Yes | Playwright + API |
| Final Decision | ✅ | No | Yes | Yes | Yes | Yes | Playwright + API |
| Offer CRUD | ✅ | No | Yes | Yes | Yes | Yes | API Tests |
| Onboarding Lifecycle | ✅ | No | Yes | Yes | Yes | Yes | API Tests |
| Notifications | ✅ | No | Yes | Yes | Yes | Yes | API Tests |
| Document Upload | ✅ | No | Yes | Yes | Yes | Yes | Playwright |
| Search | ✅ | No | Yes | Yes | Yes | Yes | Playwright |
| Reports/Export | ✅ | No | Yes | Yes | Yes | Yes | API Tests |
| RBAC Enforcement | ✅ | No | Yes | Yes | Yes | Yes | API Tests |
| Error Handling | ✅ | Yes | Yes | Yes | Yes | Yes | API Tests |
| Rate Limiting | ✅ | No | Yes | No | No | No | API Tests |
| Health Check | ✅ | No | No | No | No | No | API Tests |

---

# 22. TEST DATA REQUIREMENTS

## 22.1 Seed Users

| Email | Role | Employee Code | Password |
|-------|------|---------------|----------|
| admin@atlas.com | SYSTEM_ADMIN | ADMIN001 | ChangeMe!Admin123! |
| hr.admin@atlas.com | HR_ADMIN | HR001 | ChangeMe!Admin123! |
| reception@atlas.com | RECEPTIONIST | RECP001 | ChangeMe!Admin123! |
| l1.panel@atlas.com | L1_PANEL | L1PANEL001 | ChangeMe!Admin123! |
| l2.panel@atlas.com | L2_PANEL | L2PANEL001 | ChangeMe!Admin123! |
| tech.head@atlas.com | TECH_HEAD | TECHHEAD001 | ChangeMe!Admin123! |

## 22.2 Test Candidate Data

```json
{
  "personal_details": {
    "first_name": "John",
    "middle_name": "Michael",
    "last_name": "Doe",
    "email": "john.doe.test@example.com",
    "phone": "9876543210",
    "alternate_phone": "9876543211",
    "gender": "MALE",
    "date_of_birth": "1990-05-15",
    "current_address": "123 Main Street, Koramangala, Bangalore",
    "permanent_address": "456 Park Avenue, Mumbai",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560034",
    "position_applied_for": "Senior Software Engineer",
    "referred_by": "Jane Smith",
    "reference_number": "REF-001"
  },
  "professional_details": {
    "current_company": "TechCorp India",
    "current_designation": "Software Engineer",
    "total_experience": 5.0,
    "relevant_experience": 4.0,
    "current_ctc": 1500000,
    "expected_ctc": 2200000,
    "notice_period": "30 days",
    "joining_availability": "Immediate",
    "preferred_location": "Bangalore",
    "employment_type": "FULL_TIME"
  },
  "employment_history": [
    {
      "company_name": "TechCorp India",
      "designation": "Software Engineer",
      "start_date": "2020-01-15",
      "end_date": "2024-12-31",
      "responsibilities": "Full-stack development, API design, code reviews",
      "reason_for_leaving": "Looking for growth opportunities"
    }
  ],
  "education": [
    {
      "qualification": "B.Tech Computer Science",
      "institution_name": "Indian Institute of Technology",
      "university": "VTU",
      "passing_year": 2019,
      "percentage": 85.0,
      "grade": "First Class with Distinction",
      "specialization": "Computer Science and Engineering"
    }
  ],
  "personality_assessment": [
    {"question_number": 1, "rating": 4},
    {"question_number": 2, "rating": 5},
    {"question_number": 3, "rating": 4},
    {"question_number": 4, "rating": 3},
    {"question_number": 5, "rating": 5},
    {"question_number": 6, "rating": 4},
    {"question_number": 7, "rating": 5},
    {"question_number": 8, "rating": 4},
    {"question_number": 9, "rating": 3},
    {"question_number": 10, "rating": 4},
    {"question_number": 11, "rating": 5},
    {"question_number": 12, "rating": 4},
    {"question_number": 13, "rating": 3},
    {"question_number": 14, "rating": 5},
    {"question_number": 15, "rating": 4},
    {"question_number": 16, "rating": 4},
    {"question_number": 17, "rating": 3},
    {"question_number": 18, "rating": 5}
  ],
  "situational_responses": [
    {"question_number": 1, "selected_option": "B"},
    {"question_number": 2, "selected_option": "A"},
    {"question_number": 3, "selected_option": "D"},
    {"question_number": 4, "selected_option": "B"},
    {"question_number": 5, "selected_option": "B"}
  ],
  "written_responses": [
    {"question_number": 1, "answer_text": "When I received feedback about my communication style being too direct, I initially felt defensive. However, I took time to reflect and realized the feedback was valid. I worked on softening my approach while maintaining clarity."},
    {"question_number": 2, "answer_text": "Taking responsibility means owning both successes and failures. In my previous role, I missed a critical deadline. Instead of blaming dependencies, I communicated the delay proactively and worked overtime to deliver."},
    {"question_number": 3, "answer_text": "A new team member was struggling with our codebase. Without being asked, I created a comprehensive onboarding guide and spent lunch breaks helping them understand our architecture and conventions."},
    {"question_number": 4, "answer_text": "During a sprint planning meeting, I was the only one who questioned the feasibility of a two-week timeline for a complex feature. I presented my analysis and we adjusted the scope accordingly."},
    {"question_number": 5, "answer_text": "I typically start by observing their working patterns and understanding their communication preferences. I then adapt my approach to complement their style rather than trying to change them."}
  ],
  "declaration": {
    "declaration_accepted": true,
    "consent_accepted": true,
    "signed_date": "2026-07-16"
  }
}
```

## 22.3 Rejected Candidate Data

```json
{
  "personal_details": {
    "first_name": "Sarah",
    "last_name": "Rejected",
    "email": "sarah.rejected@example.com",
    "phone": "9876543220",
    "gender": "FEMALE",
    "date_of_birth": "1995-03-20",
    "current_address": "789 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "position_applied_for": "Junior Developer"
  },
  "professional_details": {
    "total_experience": 1.0,
    "relevant_experience": 0.5,
    "employment_type": "FULL_TIME"
  }
}
```

## 22.4 Hold Candidate Data

Similar to rejected candidate but with `hr_status: HOLD` at HR review.

---

# 23. PRE-TEST CHECKLIST

| # | Item | Status | Notes |
|---|------|:---:|-------|
| 1 | Backend server running on port 8000 | ☐ | `python -m uvicorn app:app --reload` |
| 2 | Frontend server running on port 5173 | ☐ | `npm run dev` |
| 3 | PostgreSQL database running | ☐ | Docker or local |
| 4 | Database migrations applied | ☐ | `alembic upgrade head` |
| 5 | Seed data loaded | ☐ | `python -m database.seed` |
| 6 | Redis running (for rate limiting) | ☐ | Docker or local |
| 7 | Environment variables set | ☐ | SECRET_KEY, DATABASE_URL, ALGORITHM, etc. |
| 8 | `uploads/` directory exists | ☐ | For file storage |
| 9 | Health check passes | ☐ | `GET /health` returns `{"status": "healthy"}` |
| 10 | All test accounts accessible | ☐ | Login with each account |
| 11 | CORS configured | ☐ | Frontend origin in CORS_ORIGINS |
| 12 | Email service configured | ☐ | Or mock for testing |

---

# 24. POST-TEST CHECKLIST

| # | Item | Status | Notes |
|---|------|:---:|-------|
| 1 | Database records verified | ☐ | Check all tables for expected data |
| 2 | Workflow statuses verified | ☐ | Each candidate in expected status |
| 3 | Activity logs verified | ☐ | All actions logged correctly |
| 4 | Notifications verified | ☐ | Correct users received notifications |
| 5 | Dashboard counts verified | ☐ | KPI numbers match actual data |
| 6 | Email history verified | ☐ | Emails queued/sent (if enabled) |
| 7 | File uploads verified | ☐ | Files stored in correct location |
| 8 | Test data cleaned up | ☐ | Remove test candidates if needed |
| 9 | Test accounts unchanged | ☐ | Passwords and roles intact |
| 10 | No stale sessions | ☐ | Refresh tokens revoked |

---

# FEATURE COVERAGE MATRIX

| Module | Implementation Status | Frontend Pages | Backend Endpoints | DB Entities | Manual Test Ready | Automation Ready |
|--------|:---:|----------------|-------------------|-------------|:---:|:---:|
| Authentication | ✅ Implemented | `/login` | 4 | users, refresh_tokens, roles, permissions | ✅ | ✅ |
| Candidate Registration | ✅ Implemented | `/register-candidate` | 1 (POST) | candidates, 8 sub-tables | ✅ | ✅ |
| Candidate Management | ✅ Implemented | `/candidates` | 4 (GET, PUT, DELETE) | candidates | ✅ | ✅ |
| Reception Workflow | ✅ Implemented | `/candidates` (buttons) | 2 (forward, reject) | candidates, activity_logs, notifications | ✅ | ✅ |
| HR Review | ✅ Implemented | `/hr/queue`, `/hr/review/$id` | 1 (POST) | candidates, interview_rounds, assignments | ✅ | ✅ |
| Technical Evaluation | ✅ Implemented | `/interviewer/queue`, `/interviewer/evaluate/$id` | 2 (GET, POST) | interview_rounds, assignments | ✅ | ✅ |
| CEO Evaluation | ✅ Implemented | `/ceo/queue`, `/ceo/evaluate/$id` | 2 (GET, POST) | interview_rounds | ✅ | ✅ |
| Final Discussion/Decision | ✅ Implemented | `/final-discussion/$id`, `/final-decision/$id` | 2 (GET, POST) | final_decisions | ✅ | ✅ |
| Offer Management | ✅ Implemented | `/offer/*` (6 pages) | 8 (CRUD + status) | offers, offer_history, offer_documents | ✅ | ✅ |
| Onboarding | ✅ Implemented | `/onboarding/*` (3 pages) | 10 (CRUD + sub) | onboarding, doc_verification, bgv, assets, checklist | ✅ | ✅ |
| Notifications | ✅ Implemented | NotificationBell component | 5 (CRUD) | notifications | ✅ | ✅ |
| Activity Logs | ✅ Implemented | Detail page timelines | 4 (list, entity, user, stats) | activity_logs | ✅ | ✅ |
| Document Storage | ✅ Implemented | Detail page document tabs | 8 (CRUD + download) | document_storage | ✅ | ✅ |
| Search | ⚠ Partially Implemented | Search inputs | 4 | saved_searches | ⚠ | ⚠ |
| Reports/Export | ⚠ Partially Implemented | Export buttons | 4 (CSV export) | — | ⚠ | ✅ |
| Email Management | ⚠ Backend Only | ❌ No frontend | 9 | email_templates, email_history, email_queue | ⚠ | ✅ |
| BGV | ⚠ Partially Implemented | Onboarding detail | 3 | background_verification | ⚠ | ✅ |
| Scheduler | ⚠ Backend Only | ❌ No frontend | 2 | — | ⚠ | ✅ |
| User Management | ❌ Not Implemented (new frontend) | ❌ No frontend | 6 | users, roles | ❌ | ✅ (API) |
| Scorecard | ⚠ Partially Implemented | Evaluation forms | 1 (GET) | — | ⚠ | ✅ |
| Candidate Portal | ✅ Implemented | `/candidate-portal/$id` | 2 (GET) | — | ✅ | ✅ |
| Dashboard | ✅ Implemented | `/dashboard` | 3 | — | ✅ | ✅ |

### Status Key
- ✅ **Implemented** — Fully functional, ready for testing
- ⚠ **Partially Implemented** — Backend exists but frontend may be incomplete
- ❌ **Not Implemented** — Missing in new frontend

---

*End of Document*
*Total Test Cases: 487+*
*Document Version: 1.0.0*
*Last Updated: 2026-07-16*
