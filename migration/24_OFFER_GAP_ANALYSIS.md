# Phase 7: Offer Management — GAP Analysis

**Date:** 2026-07-13  
**Status:** COMPLETE

---

## 1. Executive Summary

The backend has **NO dedicated offer management endpoints, models, schemas, or services**. Offer data exists only as fields within the `FinalDecision` table. There is no PDF generation, no email/notification system, no onboarding workflow. The frontend-only offer management module will use existing API data + client-side state.

---

## 2. Backend Analysis

### 2.1 What EXISTS in the Backend

| Feature | Location | Notes |
|---|---|---|
| `FinalDecision` table | `backend/models/applicant.py` | Contains `offered_ctc`, `joining_date`, `approved_by`, `hr_discussion`, `ceo_discussion` columns |
| `POST /api/workflow/final-decision/{candidate_id}` | `backend/routes/workflow.py` | Accepts `FinalDecisionRequest` with `offered_ctc`, `joining_date`, `hr_discussion`, `ceo_discussion` |
| `GET /api/workflow/final-discussion/{candidate_id}` | `backend/routes/workflow.py` | Returns `FinalDiscussionResponse` with candidate data + technical/CEO scores |
| `GET /api/applicants?limit=500` | `backend/routes/applicant.py` | Returns all applicants with status, name, position |
| `GET /api/candidate/{id}` | `backend/routes/applicant.py` | Returns full candidate detail |
| `GET /api/candidate/{id}/documents` | `backend/routes/applicant.py` | Lists candidate documents |
| Document download | `backend/routes/applicant.py` | `GET /api/candidate/{id}/documents/{doc_id}/download` |
| Status transitions | `backend/services/workflow_service.py` | `SELECTED` status managed by state machine |

### 2.2 What DOES NOT EXIST in the Backend

| Feature | Status |
|---|---|
| Offer letter generation | ❌ Does not exist |
| Offer model/table | ❌ No separate offer model |
| PDF generation library | ❌ No `reportlab`, `weasyprint`, or similar |
| Email/notification service | ❌ No `sendgrid`, `celery`, or similar |
| Onboarding workflow | ❌ Does not exist |
| Offer status tracking | ❌ No `offer_status` field in any model |
| Offer acceptance endpoint | ❌ Does not exist |
| Candidate portal | ❌ No public route for candidate self-service |
| Offer letter download | ❌ Does not exist |
| CTC negotiation history | ❌ Does not exist |

---

## 3. Old Frontend Analysis

The old frontend has **NO separate offer management pages or components**. Offer-related functionality is embedded within:

- `FinalDecisionForm.jsx` — form fields for `offered_ctc`, `joining_date`
- `AdminCandidateReview.jsx` — admin review with CTC fields
- `FinalDecisionPage.jsx` — final decision page with offer terms
- `CandidateStatsWidget.jsx` — KPIs mention "Offers issued successfully" for SELECTED status

---

## 4. What We CAN Build

Since the backend stores `offered_ctc`, `joining_date`, and `approved_by` in `FinalDecision`, we can:

1. **Offer Dashboard** — filter `SELECTED` candidates from existing API, show KPIs
2. **Offer Queue** — list selected candidates with CTC/joining info from `FinalDiscussionResponse`
3. **Offer Builder** — form mapping to `FinalDecisionRequest` fields (CTC, joining, remarks)
4. **Offer Preview** — client-side HTML/CSS offer letter using candidate + FinalDecision data
5. **Offer Status** — client-side status tracking via localStorage (sent, accepted, declined)
6. **Offer Timeline** — reuse existing timeline component from Phase 6
7. **Candidate Portal** — public route to view offer (limited — no backend portal)
8. **Documents** — resume viewer using existing document endpoints
9. **Notifications** — toast-only (no backend support for email/SMS)

---

## 5. Key Constraints

1. No backend offer endpoints — all offer data comes from `FinalDecision` fields
2. No PDF generation — offer letter will be browser-printable HTML
3. No email notifications — toast-only feedback
4. No onboarding workflow — not in scope
5. No candidate self-service portal — limited public route
6. Offer status is client-side only (localStorage) — not persisted to backend

---

## 6. Recommendation

Implement a **frontend-only offer management module** that:
- Uses existing API data (applicants + FinalDecision)
- Generates offer letters client-side (HTML/CSS for print)
- Tracks offer status in localStorage
- Provides a public candidate portal route
- Integrates with the existing final-decision workflow
